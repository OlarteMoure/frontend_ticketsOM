<template>
  <div class="overlay login-container">
    <Loading v-if="loading" />
    <div class="login-panel3">
      <div class="login-panel2">
        <div class="login-panel">
          <div class="panel">
            <h1 class="login-app-title" style="color: #003162; text-align: center; margin-bottom: 30px; font-weight: 800;">#soyFanOM</h1>
            <!-- <div class="login-title">OlarteMoure | Omniom</div> -->
            <button class="btn-login" @click="loginWithAzure">
              <img src="../assets/Microsoft-Logo.png" style="width:15%;" alt="Microsoft">
              <span style="top:10px; font-size:0.8em;">&nbsp;&nbsp;&nbsp; Log in with Microsoft</span>
            </button>
          </div>
          <small style="font-size: 0.7em; margin-top:10px; color: rgb(199 197 197);">
            OmniOM v1 by OlarteMoure & Asociados ©.
          </small>
        </div>
      </div>
    </div> 
  </div>
</template>

<script>
import Loading from './LoadingSpinner.vue';

export default {
  components: { Loading },
  name: 'LoginMicrosoft',
  data() {
    return {
      loading: false,
      state: false,
      role: null,
      entity: null,
      company: null,
      code: null,
      error: null,
      jwt: null
    };
  },
  methods: {
    // ✅ Conversor de Blob a Base64
    blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result); // Retorna data:image/png;base64,...
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    },

    generateCodeVerifier() {
      const array = new Uint32Array(28);
      window.crypto.getRandomValues(array);
      return Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('');
    },
    async generateCodeChallenge(codeVerifier) {
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const hashed = await window.crypto.subtle.digest('SHA-256', data);
      const base64Url = btoa(String.fromCharCode(...new Uint8Array(hashed)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      return base64Url;
    },
    generateRandomString(length) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = Date.now().toString();
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },

    async loginWithAzure() {
      const loginRequest = { scopes: ["User.Read"] };
      try {
        this.loading = true;
        // Inicia login con redirección (más robusto que el popup)
        await this.$msal.loginRedirect(loginRequest);
      } catch (error) {
        console.error('Error al iniciar loginRedirect:', error);
        alert("Error al iniciar el flujo de autenticación con Microsoft.");
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100%;
  background: url('@/assets/fondo.jpg') no-repeat center center fixed;
  background-size: cover;
}

.overlay {
  display:flex;
  justify-content:flex-end;
  align-items:stretch;
  height:100vh;
  width:100%;
  background-color: rgba(255,255,255,0.1);
}

.login-panel3 {
  background-color: rgba(255,255,255,0.5);
  width:100%;
  max-width:850px;
  height:100vh;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  box-shadow:-2px 0 20px rgba(0,0,0,0.1);
}

.login-panel2 {
  background-color: rgba(255,255,255,0.7);
  width:100%;
  max-width:750px;
  height:100vh;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
}

.login-panel {
  background-color: rgba(255,255,255);
  width:100%;
  max-width:650px;
  height:100vh;
  padding:60px 60px;
  margin-left:100px;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
}

.panel {
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  border: solid 1px #005BA1;
  padding:15px;
  border-radius:10px;
}

.panel > img.logo {
  max-width:250px;
  margin-bottom:10px;
}

.panel .login-title {
  font-size:16px;
  color:#005BA1;
  font-weight:bold;
  text-align:center;
  margin-bottom:10px;
}

.btn-login {
  border:1px solid #005BA1 !important;
  background-color:#fff;
  color:#005BA1;
  border:none;
  padding:5px 8px;
  font-size:15px;
  border-radius:10px;
  width:100%;
  cursor:pointer;
  font-weight:bold;
}

.btn-login:hover {
  background-color:#004080;
  color:white;
}

@media (max-width:768px) {
  .overlay {
    justify-content:center;
  }
  .login-panel3,
  .login-panel2,
  .login-panel,
  .panel {
    max-width:90%;
    padding:40px 20px;
    width:100%;
    padding:0px;
    margin:0px;
  }
  img {
    width:10%;
  }
}
</style>
