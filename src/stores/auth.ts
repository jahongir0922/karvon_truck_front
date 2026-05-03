import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import axios from 'axios';
import { apiLogin, apiGetMe, apiCreateUser } from 'src/api';
import type { User } from 'src/types';

const TOKEN_KEY = 'x-auth-token';

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

  async function login(email: string, password: string) {
    const res = await apiLogin(email, password);
    const t = res.headers['x-auth-token'] as string | undefined;
    if (t) applyToken(t);
    return res.data.data;
  }

  async function register(name: string, email: string, password: string) {
    const res = await apiCreateUser({ name, email, password });
    return res.data.data;
  }

  async function fetchMe() {
    if (!token.value) return;
    try {
      const res = await apiGetMe();
      user.value = res.data.data;
    } catch {
      clearToken();
    }
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
