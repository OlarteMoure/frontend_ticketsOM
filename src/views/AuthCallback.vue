<template>
  <div class="callback-container">
    <div v-if="!errorMsg" class="loader"></div>
    <p>{{ errorMsg ? '❌ Error en autenticación' : 'Procesando autenticación...' }}</p>
    <small v-if="!errorMsg">Espere un momento...</small>
    <pre v-if="errorMsg" style="color:red; max-width:80%; overflow:auto; text-align:left; font-size:12px;">{{ errorMsg }}</pre>
  </div>
</template>

<script>
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import axios from 'axios';

export default {
  name: 'AuthCallback',
  data() {
    return { errorMsg: '' };
  },
  methods: {
    blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  },
  async mounted() {
    console.log("[Callback] Componente montado. Verificando cuenta activa...");
    try {
      // La respuesta del redirect ya fue procesada por main.js (handleRedirectPromise).
      // Aquí solo necesitamos verificar que la cuenta quedó activa.
      const account = this.$msal.getActiveAccount() || (this.$msal.getAllAccounts()[0] || null);
      if (!account) {
        this.errorMsg = '[Callback] No hay cuenta activa después del redirect.';
        console.error(this.errorMsg);
        return;
      }
      console.log('[Callback] Cuenta activa encontrada:', account.username);

      // 2) Obtener token de acceso
      const loginRequest = { scopes: ["User.Read"] };
      let tokenResponse;
      try {
        tokenResponse = await this.$msal.acquireTokenSilent({
          account,
          scopes: loginRequest.scopes
        });
      } catch (err) {
        if (err instanceof InteractionRequiredAuthError || err.name === 'InteractionRequiredAuthError') {
          console.warn('[Callback] Interaction required, redirigiendo para token...');
          return this.$msal.acquireTokenRedirect({
            account,
            scopes: loginRequest.scopes
          });
        } else {
          throw err;
        }
      }

      const accessToken = tokenResponse && tokenResponse.accessToken;
      if (!accessToken) throw new Error('No se obtuvo access token');

      // 3) Obtener perfil de Graph
      const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const profile = await profileRes.json();

      // 4) Obtener imagen de perfil
      let photoBase64 = '';
      try {
        const photoRes = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (photoRes.ok) {
          const photoBlob = await photoRes.blob();
          photoBase64 = await this.blobToBase64(photoBlob);
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
      
      console.log('[Callback] Perfil obtenido:', userDisplayName);

      // 5) Autenticación contra backend local
      axios.post(process.env.VUE_APP_BACKEND_URL + 'auth/authMicrosoft', {
        email: profile.mail, 
        access_token: accessToken
      }).then(response => {
        const data = response.data;
        this.$store.dispatch('loginSuccess', {
          jwt_access_token: data.jwt,
          jwt_refresh_token: data.refresh_token,
          userData: null,
          userDisplayName,
          userEmail,
          userPhoto
        });

        const baseUrl = (process.env.VUE_APP_BACKEND_URL || '').replace(/\/$/, '');
        const userInfoUrl = `${baseUrl}/auth/userInfo`;

        axios.get(userInfoUrl, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.jwt}`
          },
        }).then((response2) => {
          const userData = Array.isArray(response2.data) ? response2.data[0] : response2.data;
          this.$store.commit('SET_USER_DATA', userData);
          console.log("[Callback] ¡Login completado! Redirigiendo a /home...");
          this.$router.push("/home").catch(err => console.error("Error redirect:", err));
        }).catch((error) => {
          this.errorMsg = '[Callback] Error en /auth/userInfo: ' + (error.response ? JSON.stringify(error.response.data) : error.message);
          console.error(this.errorMsg, error);
        });

      }).catch(error => {
        this.errorMsg = '[Callback] Error en auth/authMicrosoft: ' + (error.response ? JSON.stringify(error.response.data) : error.message);
        console.error(this.errorMsg, error);
      });

    } catch (e) {
      if (e.errorCode !== "no_token_request_cache_error") {
        this.errorMsg = '[Callback] Error general: ' + (e.message || JSON.stringify(e));
        console.error(this.errorMsg, e);
      }
    }
  }
}
</script>

<style scoped>
.callback-container {
  display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;
  font-family: sans-serif; color: #555;
}
.loader {
  border: 4px solid #f3f3f3; border-top: 4px solid #0078d4;
  border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;
  margin-bottom: 20px;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
