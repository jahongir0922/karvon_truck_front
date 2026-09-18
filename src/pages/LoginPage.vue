<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-grey-2 p-4 gap-3">
    <q-card class="w-full max-w-[400px] p-4">
      <q-tabs v-model="tab" dense class="text-primary mb-4" @update:model-value="clearErrors">
        <q-tab name="login" :label="t('auth.loginTab')" />
        <q-tab name="register" :label="t('auth.registerTab')" />
      </q-tabs>

      <q-tab-panels v-model="tab" animated>
        <!-- Login -->
        <q-tab-panel name="login" class="p-0">
          <q-form class="flex flex-col gap-3" @submit.prevent="handleLogin">
            <q-input
              v-model="loginForm.email"
              filled
              :label="t('auth.email')"
              type="email"
              autocomplete="email"
              :error="!!errors.email"
              :error-message="errors.email"
            />
            <q-input
              v-model="loginForm.password"
              filled
              :label="t('auth.password')"
              :type="showPass ? 'text' : 'password'"
              autocomplete="current-password"
              :error="!!errors.password"
              :error-message="errors.password"
            >
              <template #append>
                <q-icon
                  :name="showPass ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  role="button"
                  :aria-label="t('auth.showPassword')"
                  @click="showPass = !showPass"
                />
              </template>
            </q-input>
            <div v-if="errors.general" class="text-negative text-sm">{{ errors.general }}</div>
            <q-btn
              color="primary"
              :label="t('auth.loginBtn')"
              class="w-full"
              :loading="loading"
              type="submit"
            />
          </q-form>
        </q-tab-panel>

        <!-- Register -->
        <q-tab-panel name="register" class="p-0">
          <q-form class="flex flex-col gap-3" @submit.prevent="handleRegister">
            <q-input
              v-model="registerForm.name"
              filled
              :label="t('auth.name')"
              autocomplete="name"
              :error="!!errors.name"
              :error-message="errors.name"
            />
            <q-input
              v-model="registerForm.email"
              filled
              :label="t('auth.email')"
              type="email"
              autocomplete="email"
              :error="!!errors.email"
              :error-message="errors.email"
            />
            <q-input
              v-model="registerForm.password"
              filled
              :label="t('auth.password')"
              :type="showPass ? 'text' : 'password'"
              autocomplete="new-password"
              :error="!!errors.password"
              :error-message="errors.password"
            >
              <template #append>
                <q-icon
                  :name="showPass ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  role="button"
                  :aria-label="t('auth.showPassword')"
                  @click="showPass = !showPass"
                />
              </template>
            </q-input>
            <div v-if="errors.general" class="text-negative text-sm">{{ errors.general }}</div>
            <q-btn
              color="primary"
              :label="t('auth.registerBtn')"
              class="w-full"
              :loading="loading"
              type="submit"
            />
          </q-form>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <q-btn flat no-caps color="primary" icon="arrow_back" :label="t('common.goHome')" to="/" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'stores/auth';
import { getErrorMessage, getErrorStatus } from 'src/utils/error';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const { t } = useI18n();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const tab = ref<'login' | 'register'>('login');
const showPass = ref(false);
const loading = ref(false);

const loginForm = reactive({ email: '', password: '' });
const registerForm = reactive({ name: '', email: '', password: '' });
const errors = reactive<Record<string, string>>({});

function clearErrors() {
  Object.keys(errors).forEach((k) => delete errors[k]);
}

function redirectTarget(): string {
  const redirect = route.query.redirect;
  // Faqat ilova ichidagi yo'lga qaytaramiz (tashqi URL emas)
  return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/';
}

async function handleLogin() {
  clearErrors();
  const email = loginForm.email.trim();
  if (!email) { errors.email = t('auth.emailRequired'); return; }
  if (!EMAIL_RE.test(email)) { errors.email = t('auth.emailInvalid'); return; }
  if (!loginForm.password) { errors.password = t('auth.passwordRequired'); return; }

  loading.value = true;
  try {
    await auth.login(email, loginForm.password);
    await router.push(redirectTarget());
  } catch (err: unknown) {
    // 400 — email/parol noto'g'ri; qolganlari (tarmoq, server) — haqiqiy xabar
    errors.general =
      getErrorStatus(err) === 400
        ? t('auth.invalidCredentials')
        : getErrorMessage(err, t('common.error'));
  } finally {
    loading.value = false;
  }
}

async function handleRegister() {
  clearErrors();
  const name = registerForm.name.trim();
  const email = registerForm.email.trim();
  if (!name) { errors.name = t('auth.nameRequired'); return; }
  if (name.length < 2) { errors.name = t('auth.nameMin'); return; }
  if (!email) { errors.email = t('auth.emailRequired'); return; }
  if (!EMAIL_RE.test(email)) { errors.email = t('auth.emailInvalid'); return; }
  if (!registerForm.password) { errors.password = t('auth.passwordRequired'); return; }
  if (registerForm.password.length < 8) { errors.password = t('auth.passwordMin'); return; }

  loading.value = true;
  try {
    // Ro'yxatdan o'tgach darhol tizimga kiritiladi
    await auth.register(name, email, registerForm.password);
    $q.notify({ type: 'positive', message: t('auth.registered') });
    await router.push(redirectTarget());
  } catch (err: unknown) {
    errors.general = getErrorMessage(err, t('auth.registerError'));
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  // Allaqachon kirgan foydalanuvchiga login sahifasi kerak emas
  if (auth.isLoggedIn) void router.replace(redirectTarget());
});
</script>
