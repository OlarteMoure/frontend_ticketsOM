export const msalConfig = {
  auth: {
    clientId: "98000995-e6d1-4ee7-88c8-21c5bad17f19", // ID de la app registrada
    authority: "https://login.microsoftonline.com/e6b3a5a1-6762-4c78-b32b-eb7af6ba9663", // ID del directorio (tenant)
    //redirectUri: "https://localhost:8081/auth/microsoft" // Tu URL de callback frontend
    redirectUri: process.env.VUE_APP_FRONTEND_URL + "auth/microsoft",
    navigateToLoginRequestUrl: false // NO redirigir automáticamente a /login después del redirect
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false
  }
};