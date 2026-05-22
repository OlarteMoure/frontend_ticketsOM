import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '../store'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginMicrosoft.vue')
  },
  {
    path: '/auth/microsoft',
    name: 'auth-callback',
    component: () => import('../views/AuthCallback.vue')
  },
  {
    path: '/sso',
    name: 'sso-receiver',
    component: () => import('../views/SsoReceiver.vue')
  },
  {
    path: '/',
    component: () => import('../views/Dashboard.vue'),
    redirect: '/home',
    children: [
      { 
        path: 'home', 
        name: 'reports', 
        component: () => import('../components/Reports.vue'),
        props: { viewType: 'solicitante' }
      },
      { 
        path: 'assigned', 
        name: 'assigned-tickets', 
        component: () => import('../components/Reports.vue'), 
        props: { viewType: 'responsable' },
        meta: { requiresRole: ['Administrador', 'Gestionador'] } 
      },
      { 
        path: 'global', 
        name: 'global-tickets', 
        component: () => import('../components/Reports.vue'), 
        props: { viewType: 'global' },
        meta: { requiresRole: ['Administrador'] } 
      },
      { path: 'create', name: 'create', component: () => import('../components/TicketCreate.vue') },
      {
        path: 'config',
        name: 'config',
        component: () => import('../components/AdminConfig.vue'),
        meta: { requiresRole: 'Administrador' }
      },
      {
        path: 'advanced-reports',
        name: 'advanced-reports',
        component: () => import('../views/AdvancedReports.vue'),
        meta: { requiresRole: ['Administrador', 'Gestionador'] }
      },
      {
        path: 'statistics',
        name: 'statistics',
        component: () => import('../views/Statistics.vue'),
        meta: { requiresRole: ['Administrador', 'Gestionador'] }
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach(async (to, from, next) => {
  const user = store.state.userData;
  const token = store.state.jwt_access_token;

  // Permitir login, callback de MSAL y SSO sin autenticación
  if (to.name === 'login' || to.name === 'auth-callback' || to.name === 'sso-receiver') {
    return next();
  }

  // Redirigir a login si no hay usuario o token
  if (!user || !token) {
    return next({ name: 'login' });
  }

  // Verificar permisos de rol
  if (to.meta && to.meta.requiresRole) {
    const currentRole = store.state.userData?.role;
    const allowedRoles = Array.isArray(to.meta.requiresRole)
      ? to.meta.requiresRole
      : [to.meta.requiresRole];

    let hasAccess = false;
    if (allowedRoles.includes('Administrador') && store.getters.isAdmin) hasAccess = true;
    if (allowedRoles.includes('Gestionador') && store.getters.isGestor) hasAccess = true;
    if (allowedRoles.includes(currentRole)) hasAccess = true;

    if (!hasAccess) {
      return next({ name: 'reports' }); // Redirigir si no tiene permiso
    }
  }

  next();
})

export default router
