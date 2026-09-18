<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-grey-3 text-primary">
      <q-toolbar>
        <q-toolbar-title class="font-bold">
          <router-link to="/" class="text-primary">Karvon Truck</router-link>
        </q-toolbar-title>
        <q-select
          :model-value="locale"
          :options="localeOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          dense
          outlined
          class="mr-2"
          style="min-width: 120px"
          :aria-label="t('nav.language')"
          @update:model-value="onLocaleChange"
        />
        <template v-if="auth.isLoggedIn">
          <span class="text-sm mr-2 ellipsis" style="max-width: 140px">{{ auth.user?.name }}</span>
          <q-btn flat dense icon="logout" :aria-label="t('nav.logout')" @click="handleLogout">
            <q-tooltip>{{ t('nav.logout') }}</q-tooltip>
          </q-btn>
        </template>
        <template v-else>
          <q-btn flat dense :label="t('nav.login')" to="/login" />
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
        <q-route-tab to="/" exact replace icon="local_shipping" :label="t('nav.loads')" />
        <q-route-tab to="/create-ads" exact replace icon="add_circle_outline" :label="t('nav.addLoad')" />
        <q-route-tab to="/my-ads" exact replace icon="list_alt" :label="t('nav.myLoads')" />
        <q-route-tab
          v-if="auth.isAdmin"
          to="/admin"
          replace
          icon="admin_panel_settings"
          :label="t('nav.admin')"
        />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'stores/auth';
import { setLocale, isMessageLanguage } from 'boot/i18n';

const { t, locale } = useI18n();
const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const localeOptions = [
  { label: "O'zbek", value: 'uz' },
  { label: 'Ўзбек', value: 'uz-CY' },
  { label: 'Русский', value: 'ru' },
];

function onLocaleChange(val: unknown) {
  if (isMessageLanguage(val)) setLocale(val);
}

function handleLogout() {
  auth.logout();
  // Kirish talab qiladigan sahifada bo'lsak — bosh sahifaga
  if (route.meta.requiresAuth) void router.push('/');
}

onMounted(() => {
  void auth.fetchMe();
});
</script>
