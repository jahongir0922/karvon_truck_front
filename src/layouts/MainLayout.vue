<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-grey-3 text-primary">
      <q-toolbar>
        <q-toolbar-title class="font-bold">Karvon</q-toolbar-title>
        <q-select
          v-model="locale"
          :options="localeOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          dense
          outlined
          class="mr-2"
          style="min-width: 120px"
          @update:model-value="onLocaleChange"
        />
        <template v-if="auth.isLoggedIn">
          <span class="text-sm mr-2">{{ auth.user?.name }}</span>
          <q-btn flat dense icon="logout" @click="handleLogout" />
        </template>
        <template v-else>
          <q-btn flat dense :label="t('auth.login')" to="/login" />
        </template>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="fade">
          <component :is="Component" :key="$route.path" />
        </transition>
      </router-view>
    </q-page-container>

    <q-footer elevated class="bg-grey-3 text-primary">
      <q-tabs no-caps>
        <q-route-tab to="/" exact replace :label="t('nav.loads')" />
        <q-route-tab to="/create-ads" exact replace :label="t('nav.addLoad')" />
        <q-route-tab to="/my-ads" exact replace :label="t('nav.myLoads')" />
        <q-route-tab v-if="auth.isAdmin" to="/admin" exact replace :label="t('nav.admin')" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();
const auth = useAuthStore();
const router = useRouter();

const localeOptions = [
  { label: "O'zbek", value: 'uz' },
  { label: 'Ўзбек', value: 'uz-CY' },
  { label: 'Русский', value: 'ru' },
];

function onLocaleChange(val: string) {
  locale.value = val;
  localStorage.setItem('locale', val);
}

onMounted(() => {
  const saved = localStorage.getItem('locale');
  if (saved) locale.value = saved;
  void auth.fetchMe();
});

function handleLogout() {
  auth.logout();
  void router.push('/');
}
</script>
