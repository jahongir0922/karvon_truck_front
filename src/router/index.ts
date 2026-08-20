import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useAuthStore } from 'stores/auth';

export default defineRouter(function ({ store }) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach(async (to) => {
    const auth = useAuthStore(store);

    if (to.meta.requiresAuth && !auth.isLoggedIn) {
      return { path: '/login', query: { redirect: to.fullPath } };
    }

    if (to.meta.requiresAdmin) {
      // Token bor, lekin profil hali yuklanmagan bo'lsa (sahifa yangilangan holat)
      if (!auth.user) await auth.fetchMe();
      // fetchMe muvaffaqiyatsiz bo'lsa tokenni tozalaydi -> login'ga
      if (!auth.isLoggedIn) {
        return { path: '/login', query: { redirect: to.fullPath } };
      }
      if (!auth.isAdmin) return { path: '/' };
    }
  });

  return Router;
});
