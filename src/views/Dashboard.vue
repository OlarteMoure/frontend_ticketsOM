<template>
  <div class="app-layout">
    <TheSidebar />
    <main class="main-content">
      <header class="top-nav">
        <div class="breadcrumb">
          <span class="root">App</span>
          <i class="fas fa-chevron-right separator"></i>
          <span class="current">{{ currentRouteName }}</span>
        </div>
        <div class="profile-actions">
          <div class="notification-trigger">
            <i class="far fa-bell"></i>
            <span class="dot"></span>
          </div>
          <div class="user-badge">
            <div class="user-text">
              <span class="u-name">{{ user.name }}</span>
              <span class="u-role">{{ user.role }}</span>
            </div>
            <div class="u-avatar">{{ initials }}</div>
          </div>
        </div>
      </header>

      <div class="view-container">
        <transition name="page-fade" mode="out-in">
          <router-view />
        </transition>
      </div>
    </main>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import TheSidebar from '../components/TheSidebar.vue';

export default {
  name: 'DashboardView',
  components: { TheSidebar },
  computed: {
    ...mapState(['user']),
    initials() {
      return this.user ? this.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??';
    },
    currentRouteName() {
      const names = {
        'create': 'Nuevo Requerimiento',
        'config': 'Parametrización',
        'reports': 'Mis Requerimientos',
        'advanced-reports': 'Reportes Globales'
      };
      return names[this.$route.name] || 'Inicio';
    }
  }
}
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-light);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-nav {
  height: 70px;
  padding: 0 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  background: #ffffff;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
}

.breadcrumb .root {
  color: var(--text-muted);
}

.breadcrumb .separator {
  font-size: 0.7rem;
  color: var(--border-color);
}

.breadcrumb .current {
  color: var(--text-main);
  font-weight: 500;
}

.profile-actions {
  display: flex;
  align-items: center;
  gap: 25px;
}

.notification-trigger {
  position: relative;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
}

.notification-trigger .dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: #e53e3e;
  border-radius: 50%;
  border: 2px solid #fff;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-text {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.u-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-main);
}

.u-role {
  font-size: 0.75rem;
  color: var(--primary);
  font-weight: 500;
}

.u-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 49, 98, 0.2);
}

.view-container {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

.page-fade-enter-active, .page-fade-leave-active {
  transition: all 0.3s ease;
}

.page-fade-enter {
  opacity: 0;
  transform: translateX(10px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
