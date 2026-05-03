<template>
  <div class="flex items-center justify-center min-h-screen bg-grey-2 p-4">
    <q-card class="w-full max-w-[400px] p-4">
      <q-tabs v-model="tab" dense class="text-primary mb-4">
        <q-tab name="login" label="Kirish" />
        <q-tab name="register" label="Ro'yxatdan o'tish" />
      </q-tabs>

      <!-- Login -->
      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="login" class="p-0">
          <div class="flex flex-col gap-3">
            <q-input
              v-model="loginForm.email"
              filled
              label="Email"
              type="email"
              :error="!!errors.email"
              :error-message="errors.email"
            />
            <q-input
              v-model="loginForm.password"
              filled
              label="Parol"
              :type="showPass ? 'text' : 'password'"
              :error="!!errors.password"
              :error-message="errors.password"
            >
              <template #append>
                <q-icon
                  :name="showPass ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPass = !showPass"
                />
              </template>
            </q-input>
            <div v-if="errors.general" class="text-negative text-sm">{{ errors.general }}</div>
            <q-btn
              color="primary"
              label="Kirish"
              class="w-full"
              :loading="loading"
              @click="handleLogin"
            />
          </div>
        </q-tab-panel>

        <!-- Register -->
        <q-tab-panel name="register" class="p-0">
          <div class="flex flex-col gap-3">
            <q-input
              v-model="registerForm.name"
              filled
              label="Ism"
              :error="!!errors.name"
              :error-message="errors.name"
            />
            <q-input
              v-model="registerForm.email"
              filled
              label="Email"
              type="email"
              :error="!!errors.email"
              :error-message="errors.email"
            />
            <q-input
              v-model="registerForm.password"
              filled
              label="Parol"
              :type="showPass ? 'text' : 'password'"
              :error="!!errors.password"
              :error-message="errors.password"
            >
              <template #append>
                <q-icon
                  :name="showPass ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPass = !showPass"
                />
              </template>
            </q-input>
            <div v-if="errors.general" class="text-negative text-sm">{{ errors.general }}</div>
            <q-btn
              color="primary"
              label="Ro'yxatdan o'tish"
              class="w-full"
              :loading="loading"
              @click="handleRegister"
            />
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from 'stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const tab = ref<'login' | 'register'>('login');
const showPass = ref(false);
const loading = ref(false);

const loginForm = reactive({ email: '', password: '' });
const registerForm = reactive({ name: '', email: '', password: '' });
const errors = reactive<Record<string, string>>({});

function clearErrors() {
  Object.keys(errors).forEach((k) => delete errors[k]);
}

async function handleLogin() {
  clearErrors();
  if (!loginForm.email) { errors.email = 'Email kiritilishi shart'; return; }
  if (!loginForm.password) { errors.password = 'Parol kiritilishi shart'; return; }

  loading.value = true;
  try {
    await auth.login(loginForm.email, loginForm.password);
    await auth.fetchMe();
    const redirect = (route.query.redirect as string) || '/';
    await router.push(redirect);
  } catch {
    errors.general = 'Email yoki parol noto\'g\'ri';
  } finally {
    loading.value = false;
  }
}

async function handleRegister() {
  clearErrors();
  if (!registerForm.name) { errors.name = 'Ism kiritilishi shart'; return; }
  if (!registerForm.email) { errors.email = 'Email kiritilishi shart'; return; }
  if (!registerForm.password) { errors.password = 'Parol kiritilishi shart'; return; }
  if (registerForm.password.length < 5) { errors.password = 'Parol kamida 5 ta belgi bo\'lishi kerak'; return; }

  loading.value = true;
  try {
    await auth.register(registerForm.name, registerForm.email, registerForm.password);
    tab.value = 'login';
    loginForm.email = registerForm.email;
  } catch {
    errors.general = 'Ro\'yxatdan o\'tishda xatolik yuz berdi';
  } finally {
    loading.value = false;
  }
}
</script>
