import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '../store'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    component: () => import('../views/Dashboard.vue'),
    redirect: '/home',
    children: [
      { path: 'home', name: 'reports', component: () => import('../components/Reports.vue') },
      { path: 'create', name: 'create', component: () => import('../components/TicketCreate.vue') },
      { path: 'config', name: 'config', component: () => import('../components/AdminConfig.vue') },
      { path: 'advanced-reports', name: 'advanced-reports', component: () => import('../views/AdvancedReports.vue') },
      { path: 'statistics', name: 'statistics', component: () => import('../views/Statistics.vue') }
    ]
  }
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to, from, next) => {
  const user = store.state.user;
  if (to.name !== 'login' && !user) next({ name: 'login' });
  else next();
})

export default router
