import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import axios from 'axios';
import { apiLogin, apiGetMe, apiCreateUser } from 'src/api';
import { TOKEN_KEY } from 'src/constants';
import type { User } from 'src/types';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) ?? '');
  const user = ref<User | null>(null);

  const isLoggedIn = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.isAdmin ?? false);

  function applyToken(t: string) {
    token.value = t;
    localStorage.setItem(TOKEN_KEY, t);
    axios.defaults.headers.common['x-auth-token'] = t;
  }

  function clearToken() {
    token.value = '';
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
    delete axios.defaults.headers.common['x-auth-token'];
  }

  /** Profilni yuklaydi; token yaroqsiz bo'lsa (401) sessiya interceptor'da tozalanadi. */
  async function fetchMe() {
    if (!token.value) return;
    try {
      const res = await apiGetMe();
      user.value = res.data.data;
    } catch {
      // 401 — interceptor logout qiladi; boshqa xatolarda (tarmoq) tokenni saqlab qolamiz
    }
  }

  async function login(email: string, password: string) {
    const res = await apiLogin(email, password);
    const t = res.headers['x-auth-token'] as string | undefined;
    if (!t) throw new Error('x-auth-token header missing in login response');
    applyToken(t);
    await fetchMe();
  }

  /** Ro'yxatdan o'tkazib, darhol tizimga kiritadi. */
  async function register(name: string, email: string, password: string) {
    await apiCreateUser({ name, email, password });
    await login(email, password);
  }

  function logout() {
    clearToken();
  }

  // Ilovani yuklashda tokenni axiosga o'rnatish
  if (token.value) {
    axios.defaults.headers.common['x-auth-token'] = token.value;
  }

  return { token, user, isLoggedIn, isAdmin, login, register, fetchMe, logout };
});
