import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { msalConfig } from './AuthConfig';
import * as msal from '@azure/msal-browser';
import axios from 'axios';

Vue.config.productionTip = false;

// Instancia MSAL
const msalInstance = new msal.PublicClientApplication(msalConfig);

// Helper: Blob a Base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Procesar el login completo contra el backend (Graph + backend propio)
async function processBackendLogin(accessToken) {
  console.log('[main.js] Procesando login contra backend...');

  // 1) Obtener perfil de Microsoft Graph
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const profile = await profileRes.json();
  console.log('[main.js] Perfil Graph obtenido:', profile.displayName);

  // 2) Obtener imagen de perfil
  let photoBase64 = '';
  try {
    const photoRes = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (photoRes.ok) {
      const photoBlob = await photoRes.blob();
      photoBase64 = await blobToBase64(photoBlob);
    } else {
      photoBase64 = 'https://ui-avatars.com/api/?name=' +
        encodeURIComponent(profile.displayName || profile.userPrincipalName);
    }
  } catch (err) {
    photoBase64 = 'https://ui-avatars.com/api/?name=' +
      encodeURIComponent(profile.displayName || profile.userPrincipalName);
  }

  const userDisplayName = profile.displayName || '';
  const userEmail = profile.mail || profile.userPrincipalName || '';
  const userPhoto = photoBase64;

  // 3) Autenticación contra backend local
  const backendUrl = process.env.VUE_APP_BACKEND_URL;
  const authResponse = await axios.post(backendUrl + 'auth/authMicrosoft', {
    email: profile.mail || profile.userPrincipalName,
    access_token: accessToken
  });
  const data = authResponse.data;
  console.log('[main.js] JWT del backend obtenido');

  // 4) Guardar en store
  store.dispatch('loginSuccess', {
    jwt_access_token: data.jwt,
    jwt_refresh_token: data.refresh_token,
    userData: null,
    userDisplayName,
    userEmail,
    userPhoto
  });

  // 5) Obtener info de usuario del backend
  const baseUrl = (backendUrl || '').replace(/\/$/, '');
  const userInfoResponse = await axios.get(`${baseUrl}/auth/userInfo`, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.jwt}`
    }
  });
  const userData = Array.isArray(userInfoResponse.data) ? userInfoResponse.data[0] : userInfoResponse.data;
  store.commit('SET_USER_DATA', userData);
  console.log('[main.js] ¡Login completo! Usuario:', userData);

  return true;
}

async function startApp() {
  let redirectHandled = false;

  try {
    // 1) Inicializar MSAL
    await msalInstance.initialize();

    // 2) Procesar redirect de Microsoft (si venimos de loginRedirect)
    const redirectResponse = await msalInstance.handleRedirectPromise();
    if (redirectResponse && redirectResponse.account) {
      console.log('[main.js] Redirect procesado. Cuenta:', redirectResponse.account.username);
      msalInstance.setActiveAccount(redirectResponse.account);

      // 3) Usar el token obtenido directamente o intentar obtenerlo de caché
      let accessToken = redirectResponse.accessToken;
      if (!accessToken) {
        try {
          const tokenResponse = await msalInstance.acquireTokenSilent({
            account: redirectResponse.account,
            scopes: ["User.Read"]
          });
          accessToken = tokenResponse && tokenResponse.accessToken;
        } catch (tokenErr) {
          console.error('[main.js] Error obteniendo token silencioso de respaldo:', tokenErr);
        }
      }

      if (accessToken) {
        await processBackendLogin(accessToken);
        redirectHandled = true;
      } else {
        console.error('[main.js] No se pudo obtener access token para iniciar sesión.');
      }
    } else {
      // Restaurar cuenta activa si ya existe en caché
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
      }
    }
  } catch (err) {
    if (err.errorCode !== 'no_token_request_cache_error') {
      console.error('[main.js] Error inicializando MSAL:', err);
    }
  }

  // Exponer la instancia en Vue.prototype
  Vue.prototype.$msal = msalInstance;

  // Interceptor de Axios: solo actuar si hay token y está expirado
  axios.interceptors.request.use(request => {
    if (store.getters.isTokenExpired && !request.url.includes('/auth/')) {
      store.dispatch('logout');
      if (router.currentRoute.name !== 'login') {
        router.push('/login');
      }
      return Promise.reject(new Error("Token expired"));
    }
    return request;
  });

  axios.interceptors.response.use(
    response => response,
    error => {
      if (error.response && error.response.status === 401) {
        store.dispatch('logout');
        if (router.currentRoute.name !== 'login') {
          router.push('/login');
        }
      }
      return Promise.reject(error);
    }
  );

  // Montar la app
  new Vue({
    router,
    store,
    render: h => h(App)
  }).$mount('#app');

  // Si el redirect fue procesado exitosamente, ir directamente al home
  if (redirectHandled) {
    console.log('[main.js] Redirigiendo a /home...');
    router.push('/home');
  }
}

startApp();