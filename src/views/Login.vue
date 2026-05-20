<template>
  <div class="overlay login-container">
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
    </div>
    <div class="login-panel">
      <div class="panel">
        <h1 class="login-title">TicketsOM</h1>
        <p class="login-subtitle">Plataforma Interna de Gestión</p>
        <button class="btn-login" @click="loginWithAzure">
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" style="width: 20px; margin-right: 10px;">
          <span>Iniciar sesión con Microsoft</span>
        </button>
      </div>
      <small class="footer-text">
        © 2026 Organización Moderna S.A.
      </small>
    </div> 
  </div>
</template>

<script>
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import axios from 'axios';

export default {
  name: 'Login',
  data() {
    return {
      loading: false
    };
  },
  methods: {
    async loginWithAzure() {
      const loginRequest = { scopes: ["User.Read"] };
      try {
        this.loading = true;
        // Inicia login con popup (Patman usa popup por defecto en su componente)
        const loginResponse = await this.$msal.loginPopup(loginRequest);
        
        if (loginResponse && loginResponse.account) {
          this.$msal.setActiveAccount(loginResponse.account);
        }

        const account = this.$msal.getActiveAccount() || (this.$msal.getAllAccounts()[0] || null);
        if (!account) throw new Error('No se pudo obtener cuenta');

        let tokenResponse;
        try {
          tokenResponse = await this.$msal.acquireTokenSilent({
            account,
            scopes: loginRequest.scopes
          });
        } catch (err) {
          if (err instanceof InteractionRequiredAuthError) {
            tokenResponse = await this.$msal.acquireTokenPopup({
              account,
              scopes: loginRequest.scopes
            });
          } else {
            throw err;
          }
        }

        const accessToken = tokenResponse && tokenResponse.accessToken;
        const email = loginResponse.account.username;

        // Autenticación contra backend local (Endpoint Patman)
        const response = await axios.post(process.env.VUE_APP_BACKEND_URL + 'auth/authMicrosoft', {
          email: email,
          access_token: accessToken
        });

        const data = response.data;
        
        // Guardar tokens y datos en el store (Simulando lo que hace patman)
        localStorage.setItem("jwt_token", data.jwt);
        localStorage.setItem("refresh_token", data.refresh_token);
        
        const entity = data.consulta[0].id_netsuite;
        const company = "6959048"; // Valor por defecto en patman

        // Obtener info detallada del usuario
        const userInfoRes = await axios.get(`${process.env.VUE_APP_BACKEND_URL}auth/userInfo/${entity}/${company}`, {
          headers: { 'Authorization': `Bearer ${data.jwt}` }
        });

        const userData = userInfoRes.data;
        this.$store.commit('SET_USER', userData);
        
        this.$router.push("/home");

      } catch (error) {
        console.error('Error en login:', error);
        alert("Error al autenticar el usuario");
      } finally {
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
  background: #f4f7f6;
}
.login-panel {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  text-align: center;
}
.login-title { color: #2c3e50; margin-bottom: 5px; }
.login-subtitle { color: #7f8c8d; margin-bottom: 30px; }
.btn-login {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  width: 100%;
}
.btn-login:hover { background: #f9f9f9; }
.loading-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center; z-index: 100;
}
.spinner {
  border: 4px solid #f3f3f3; border-top: 4px solid #3498db;
  border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
