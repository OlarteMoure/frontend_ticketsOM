<template>
  <div class="callback-container">
    <div class="loader"></div>
    <p>Autenticando vía OmniOM SSO...</p>
    <small v-if="errorMsg" style="color:red; max-width:80%; overflow:auto; text-align:left; font-size:12px;">{{ errorMsg }}</small>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'SsoReceiver',
  data() {
    return { 
      errorMsg: '',
      messageHandler: null
    };
  },
  mounted() {
    console.log("[SSO] Componente montado. Esperando handshake de OmniOM...");
    this.messageHandler = this.handleSsoMessage.bind(this);
    window.addEventListener('message', this.messageHandler);
  },
  beforeDestroy() {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
    }
  },
  methods: {
    handleSsoMessage(event) {
      if (event.data && event.data.type === 'OMNIOM_SSO_PAYLOAD') {
        const { token, email } = event.data;
        console.log(`[SSO] Payload recibido de OmniOM. Email: ${email}`);
        
        // Responder a OmniOM para que detenga el envío de mensajes
        if (event.source) {
          event.source.postMessage({ type: 'OMNIOM_SSO_RECEIVED' }, event.origin);
          console.log(`[SSO] Confirmación OMNIOM_SSO_RECEIVED enviada a ${event.origin}`);
        }
        
        // Evitar procesar el mismo evento varias veces si llegó duplicado antes de cancelar
        window.removeEventListener('message', this.messageHandler);
        this.messageHandler = null;
        
        // Procesar autenticación
        this.authenticateWithBackend(email, token);
      }
    },
    async authenticateWithBackend(email, token) {
      try {
        console.log("[SSO] Obteniendo perfil de Graph API...");
        // 1. Obtener perfil de Microsoft Graph
        const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const profile = await profileRes.json();
        
        // 2. Obtener foto de perfil
        let photoBase64 = '';
        try {
          const photoRes = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (photoRes.ok) {
            const photoBlob = await photoRes.blob();
            photoBase64 = await this.blobToBase64(photoBlob);
          } else {
            photoBase64 = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.displayName || profile.userPrincipalName);
          }
        } catch (err) {
          photoBase64 = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.displayName || profile.userPrincipalName);
        }
        
        const userDisplayName = profile.displayName || '';
        const userEmail = email || profile.mail || profile.userPrincipalName || '';
        const userPhoto = photoBase64;

        console.log(`[SSO] Autenticando ${userEmail} en backend local...`);
        // 3. Autenticar en el backend de TicketsOM
        const response = await axios.post(process.env.VUE_APP_BACKEND_URL + 'auth/authMicrosoft', {
          email: userEmail,
          access_token: token
        });
        
        const data = response.data;
        
        // 4. Guardar tokens en Vuex
        this.$store.dispatch('loginSuccess', {
          jwt_access_token: data.jwt,
          jwt_refresh_token: data.refresh_token,
          userData: null,
          userDisplayName,
          userEmail,
          userPhoto
        });

        // 5. Obtener datos de usuario y roles
        const baseUrl = (process.env.VUE_APP_BACKEND_URL || '').replace(/\/$/, '');
        const userInfoUrl = `${baseUrl}/auth/userInfo`;

        const response2 = await axios.get(userInfoUrl, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.jwt}`
          },
        });
        
        const userData = Array.isArray(response2.data) ? response2.data[0] : response2.data;
        this.$store.commit('SET_USER_DATA', userData);
        
        console.log("[SSO] ¡Autenticación exitosa! Redirigiendo al dashboard...");
        // 6. Redirigir al inicio
        this.$router.push("/home");

      } catch (error) {
        this.errorMsg = 'Error en SSO: ' + (error.response ? JSON.stringify(error.response.data) : error.message);
        console.error(this.errorMsg, error);
      }
    },
    blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  }
}
</script>

<style scoped>
.callback-container {
  display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;
  font-family: sans-serif; color: #555; background-color: #f8f9fa;
}
.loader {
  border: 4px solid #e2e8f0; border-top: 4px solid #003162;
  border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite;
  margin-bottom: 20px;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
