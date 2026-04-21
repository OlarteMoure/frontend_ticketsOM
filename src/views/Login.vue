<template>
  <div class="login-page">
    <div class="login-card glass animate-fade">
      <div class="logo-section">
        <div class="logo-box">
          <i class="fas fa-bolt"></i>
        </div>
        <h1>Tickets<span>OM</span></h1>
        <p>Plataforma Interna de Gestión</p>
      </div>

      <div class="sso-section">
        <label class="sso-label">Acceso Institucional</label>
        <button @click="handleLogin('admin@firma.com')" :disabled="loading" class="btn-sso microsoft">
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="MS Logo" class="sso-icon">
          <span>{{ loading ? 'Conectando...' : 'Iniciar sesión con Microsoft' }}</span>
        </button>
        
        <div class="divider">
          <span>o usar cuenta de prueba</span>
        </div>

        <div class="test-accounts">
          <button @click="handleLogin('gestor@firma.com')" class="btn-test">
            <i class="fas fa-user-shield"></i> Gestor
          </button>
          <button @click="handleLogin('user@firma.com')" class="btn-test">
            <i class="fas fa-user"></i> Usuario
          </button>
        </div>
      </div>

      <footer class="login-footer">
        <p>&copy; 2026 Organización Moderna S.A.</p>
      </footer>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      loading: false
    }
  },
  methods: {
    handleLogin(email) {
      this.loading = true;
      // Simulamos autenticación de Microsoft
      setTimeout(() => {
        this.$store.dispatch('login', email);
        this.$router.push({ name: 'reports' });
        this.loading = false;
      }, 1000);
    }
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f7fa;
  background-image: radial-gradient(#003162 0.5px, transparent 0.5px);
  background-size: 30px 30px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: #ffffff;
  box-shadow: 0 20px 40px rgba(0, 49, 98, 0.15);
  text-align: center;
}

.logo-box {
  width: 60px;
  height: 60px;
  background: var(--primary);
  color: #fff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  margin: 0 auto 15px;
}

.logo-section h1 {
  font-size: 1.8rem;
  color: var(--text-main);
  margin-bottom: 5px;
  font-weight: 800;
}

.logo-section span {
  color: var(--primary);
}

.logo-section p {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-bottom: 35px;
}

.sso-label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin-bottom: 15px;
  font-weight: 700;
}

.btn-sso {
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 1px solid #d1d9e6;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  color: #5e5e5e;
}

.btn-sso:hover {
  background: #f8fafc;
  border-color: #003162;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.sso-icon {
  width: 20px;
}

.divider {
  margin: 25px 0;
  position: relative;
  text-align: center;
}

.divider::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e2e8f0;
}

.divider span {
  position: relative;
  background: #fff;
  padding: 0 10px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.test-accounts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.btn-test {
  padding: 10px;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--text-main);
  transition: 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-test:hover {
  background: #e2e8f0;
  color: var(--primary);
}

.login-footer {
  margin-top: 40px;
  font-size: 0.75rem;
  color: #a0aec0;
}
</style>
