<template>
  <div class="kt-auth">
    <router-link to="/" class="kt-auth__brand">
      <img src="favicon.svg" alt="" class="kt-auth__logo" />
      <span>Karvon<span class="kt-auth__brand-accent">Truck</span></span>
    </router-link>
    <div class="kt-auth__tagline">{{ t('auth.tagline') }}</div>

    <q-card class="kt-auth__card">
      <q-btn-toggle
        v-model="tab"
        spread
        no-caps
        unelevated
        class="kt-segment q--avoid-card-border mb-5"
        toggle-color="primary"
        color="white"
        text-color="grey-8"
        :options="[
          { value: 'login', label: t('auth.loginTab') },
          { value: 'register', label: t('auth.registerTab') },
        ]"
        @update:model-value="clearErrors"
      />

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
            >
              <template #prepend><q-icon name="mail_outline" size="20px" /></template>
            </q-input>
            <q-input
              v-model="loginForm.password"
              filled
              :label="t('auth.password')"
              :type="showPass ? 'text' : 'password'"
              autocomplete="current-password"
              :error="!!errors.password"
              :error-message="errors.password"
            >
              <template #prepend><q-icon name="lock_outline" size="20px" /></template>
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
            <div v-if="errors.general" class="kt-auth__error">
              <q-icon name="error_outline" size="18px" />
              {{ errors.general }}
            </div>
            <q-btn
              unelevated
              color="primary"
              class="w-full h-12 text-[15px]"
              :label="t('auth.loginBtn')"
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
            >
              <template #prepend><q-icon name="person_outline" size="20px" /></template>
            </q-input>
            <q-input
              v-model="registerForm.email"
              filled
              :label="t('auth.email')"
              type="email"
              autocomplete="email"
              :error="!!errors.email"
              :error-message="errors.email"
            >
              <template #prepend><q-icon name="mail_outline" size="20px" /></template>
            </q-input>
            <q-input
              v-model="registerForm.password"
              filled
              :label="t('auth.password')"
              :type="showPass ? 'text' : 'password'"
              autocomplete="new-password"
              :error="!!errors.password"
              :error-message="errors.password"
            >
              <template #prepend><q-icon name="lock_outline" size="20px" /></template>
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
            <div v-if="errors.general" class="kt-auth__error">
              <q-icon name="error_outline" size="18px" />
              {{ errors.general }}
            </div>
            <q-btn
              unelevated
              color="primary"
              class="w-full h-12 text-[15px]"
              :label="t('auth.registerBtn')"
              :loading="loading"
              type="submit"
            />
          </q-form>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <q-btn flat no-caps class="kt-auth__home" icon="arrow_back" :label="t('common.goHome')" to="/" />
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

<style scoped>
.kt-auth {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 100vh;
  padding: 24px 16px;
  background:
    radial-gradient(1200px 600px at 10% -10%, rgba(255, 255, 255, 0.18), transparent 60%),
    linear-gradient(160deg, #2459e0 0%, #1a44b3 55%, #13307f 100%);
}
.kt-auth__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #fff;
}
.kt-auth__brand-accent {
  color: #ffd27a;
}
.kt-auth__logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.25);
}
.kt-auth__tagline {
  max-width: 360px;
  margin-bottom: 16px;
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}
.kt-auth__card {
  width: 100%;
  max-width: 420px;
  padding: 20px;
  border: 0;
  border-radius: 20px;
  box-shadow: 0 24px 64px rgba(8, 20, 60, 0.35);
}
.kt-auth__card :deep(.q-tab-panels) {
  background: transparent;
}
.kt-auth__card .kt-segment {
  background: var(--kt-surface-2);
}
.kt-auth__error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fdecec;
  color: var(--q-negative);
  font-size: 14px;
}
.kt-auth__home {
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.9);
}
</style>
