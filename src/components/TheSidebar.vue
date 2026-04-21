<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="logo">
        <i class="fas fa-bolt"></i>
      </div>
      <h2>Tickets<span>OM</span></h2>
    </div>

    <nav class="nav-menu">
      <div class="menu-label">Principal</div>
      <router-link :to="{ name: 'create' }" class="nav-link">
        <i class="fas fa-plus-square"></i>
        <span>Nueva Solicitud</span>
      </router-link>
      
      <router-link :to="{ name: 'reports' }" class="nav-link">
        <i class="fas fa-list-ul"></i>
        <span>Mis Tickets</span>
      </router-link>

      <div v-if="isAdmin || isGestor" class="admin-section">
        <div class="menu-label">Administración</div>
        
        <router-link :to="{ name: 'statistics' }" class="nav-link">
          <i class="fas fa-chart-pie"></i>
          <span>Estadísticas</span>
        </router-link>

        <router-link :to="{ name: 'advanced-reports' }" class="nav-link">
          <i class="fas fa-file-invoice-dollar"></i>
          <span>Reportes Globales</span>
        </router-link>

        <router-link v-if="isAdmin" :to="{ name: 'config' }" class="nav-link">
          <i class="fas fa-sliders-h"></i>
          <span>Configuración</span>
        </router-link>
      </div>
    </nav>

    <div class="sidebar-footer">
      <button @click="logout" class="logout-btn">
        <i class="fas fa-power-off"></i>
        <span>Cerrar Sesión</span>
      </button>
    </div>
  </aside>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'TheSidebar',
  computed: {
    ...mapGetters(['isAdmin', 'isGestor'])
  },
  methods: {
    logout() {
      this.$store.dispatch('logout');
      this.$router.push({ name: 'login' });
    }
  }
}
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 30px 20px;
  background-color: #ffffff;
  border-right: 1px solid var(--border-color);
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.02);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 50px;
}

.logo {
  width: 40px;
  height: 40px;
  background: var(--primary);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.2rem;
}

.brand h2 {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -1px;
}

.brand span {
  color: var(--primary);
}

.nav-menu {
  flex: 1;
}

.menu-label {
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  margin-bottom: 12px;
  margin-top: 25px;
  padding-left: 10px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  color: #4a5568;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.2s;
  margin-bottom: 5px;
  font-weight: 500;
}

.nav-link i {
  font-size: 1.1rem;
  width: 20px;
  text-align: center;
}

.nav-link:hover {
  background: #f7fafc;
  color: var(--primary);
}

.nav-link.router-link-active {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 49, 98, 0.25);
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--danger);
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.2s;
  font-weight: 500;
}

.logout-btn:hover {
  background: #fff5f5;
  border-color: #fed7d7;
}
</style>
