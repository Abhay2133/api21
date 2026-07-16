import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue') },
  { path: '/', name: 'Dashboard', component: () => import('@/views/Dashboard.vue') },
  { path: '/terminal', name: 'Terminal', component: () => import('@/views/Terminal.vue') },
  { path: '/env', name: 'EnvManager', component: () => import('@/views/EnvManager.vue') },
  { path: '/sessions', name: 'Sessions', component: () => import('@/views/Sessions.vue') },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
  if (to.path !== '/login' && !token) {
    next('/login');
  } else if (to.path === '/login' && token) {
    next('/');
  } else {
    next();
  }
});

export default router;
