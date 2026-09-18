import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { Loading, Notify } from 'quasar';
import { i18n } from './i18n';
import { useAuthStore } from 'stores/auth';
import { DEFAULT_LOCALE, LOCALE_KEY, TOKEN_KEY } from 'src/constants';
import { getErrorMessage } from 'src/utils/error';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** true bo'lsa global "Yuklanmoqda..." ko'rsatilmaydi (fon qidiruvlari uchun) */
    skipLoading?: boolean;
  }
}

export default defineBoot(({ router, store }) => {
  axios.defaults.baseURL = process.env.API_URL || '';

  const t = (key: string) => i18n.global.t(key);

  // ── Global loader: parallel so'rovlar sonini hisoblab, oxirgisi tugaganda yashiradi ──
  let activeRequests = 0;

  function trackStart(config: AxiosRequestConfig) {
    if (config.skipLoading) return;
    activeRequests++;
    if (activeRequests === 1) Loading.show({ message: t('common.loading') });
  }

  function trackEnd(config: AxiosRequestConfig | undefined) {
    if (!config || config.skipLoading) return;
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0) Loading.hide();
  }

  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) config.headers['x-auth-token'] = token;
      config.headers['Accept-Language'] = localStorage.getItem(LOCALE_KEY) || DEFAULT_LOCALE;
      trackStart(config);
      return config;
    },
    (error: unknown) => {
      trackEnd((error as AxiosError).config);
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    },
  );

  axios.interceptors.response.use(
    (response) => {
      trackEnd(response.config);
      return response;
    },
    (error: AxiosError) => {
      trackEnd(error.config);
      const status = error.response?.status;

      if (status === 401) {
        // Token eskirgan yoki yaroqsiz — sessiyani to'liq tozalaymiz (store + localStorage).
        // Faqat kirish talab qiladigan sahifada bo'lsa login'ga yo'naltiramiz.
        const auth = useAuthStore(store);
        const wasLoggedIn = auth.isLoggedIn;
        auth.logout();
        const current = router.currentRoute.value;
        if (wasLoggedIn && current.path !== '/login') {
          Notify.create({ type: 'warning', message: t('common.sessionExpired') });
          if (current.meta.requiresAuth) {
            void router.push({ path: '/login', query: { redirect: current.fullPath } });
          }
        }
      } else if (error.code === 'ERR_NETWORK') {
        Notify.create({ type: 'negative', message: t('common.networkError') });
      } else if (status === 403) {
        Notify.create({ type: 'negative', message: getErrorMessage(error, t('common.forbidden')) });
      } else if (status !== undefined && status >= 500) {
        Notify.create({ type: 'negative', message: t('common.serverError') });
      }
      // 400 / 404 / 409 / 422 — forma xatolari, chaqiruvchi o'zi ko'rsatadi

      return Promise.reject(error);
    },
  );
});
