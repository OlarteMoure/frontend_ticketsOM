import * as msal from '@azure/msal-browser';

/**
 * Configuración de MSAL para login federado con Microsoft Azure AD.
 */
export const msalConfig = {
  auth: {
    clientId: "98000995-e6d1-4ee7-88c8-21c5bad17f19",
    authority: "https://login.microsoftonline.com/e6b3a5a1-6762-4c78-b32b-eb7af6ba9663",
    redirectUri: process.env.VUE_APP_AZURE_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: false
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (!containsPii) console.log(`[MSAL] ${message}`);
      },
      logLevel: msal.LogLevel.Info,
      piiLoggingEnabled: false
    }
  }
};

export const loginRequest = {
  scopes: ['User.Read']
};

let msalInstance = null;
let redirectResponse = null;

/**
 * Inicializa y retorna la instancia MSAL (Singleton).
 * Esta función es llamada desde main.js al arrancar la app.
 */
export async function initializeMsal() {
  if (!msalInstance) {
    msalInstance = new msal.PublicClientApplication(msalConfig);
    await msalInstance.initialize();
    
    // Manejar el redirect/callback
    try {
      redirectResponse = await msalInstance.handleRedirectPromise();
      if (redirectResponse && redirectResponse.account) {
        msalInstance.setActiveAccount(redirectResponse.account);
        console.log("[MSAL] Redirección procesada y capturada");
      }
    } catch (e) {
      console.error("MSAL: Error en handleRedirectPromise", e);
    }
  }
  return redirectResponse;
}

/**
 * Retorna la instancia ya inicializada.
 */
export function getMsalInstance() {
  if (!msalInstance) {
    throw new Error("MSAL no ha sido inicializado. Llama a initializeMsal() primero.");
  }
  return msalInstance;
}

/**
 * Inicia el flujo de redirección en la ventana principal.
 */
export async function loginRedirect() {
  const instance = getMsalInstance();
  await instance.loginRedirect(loginRequest);
}

/**
 * Abre el popup de login (Opcional, preferir loginRedirect si no se quieren popups).
 */
export async function loginWithMicrosoft() {
  const instance = getMsalInstance();
  const response = await instance.loginPopup(loginRequest);
  return response.accessToken;
}

/**
 * Cierra la sesión.
 */
export async function logoutMicrosoft() {
  try {
    const instance = getMsalInstance();
    await instance.logoutPopup();
  } catch (e) {
    console.debug('MSAL logout:', e);
  }
}
