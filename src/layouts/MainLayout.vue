<template>
  <q-layout view="hHh Lpr lFf">
    <q-header class="kt-header">
      <div class="kt-header__inner">
        <router-link to="/" class="kt-brand" aria-label="Karvon Truck">
          <img src="favicon.svg" alt="" class="kt-brand__logo" />
          <span class="kt-brand__name">Karvon<span class="text-primary">Truck</span></span>
        </router-link>

        <!-- Katta ekranda navigatsiya tepada, telefonda — pastki panelda -->
        <nav v-if="!isMobile" class="kt-nav">
          <router-link
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="kt-nav__link"
            :class="{ 'kt-nav__link--active': isActive(item) }"
          >
            <q-icon :name="item.icon" size="20px" />
            {{ item.label }}
          </router-link>
        </nav>

        <q-space />

        <q-btn
          flat
          dense
          no-caps
          class="kt-header__btn"
          icon="translate"
          :label="isMobile ? undefined : currentLocaleLabel"
          :aria-label="t('nav.language')"
        >
          <q-menu anchor="bottom right" self="top right" :offset="[0, 6]">
            <q-list class="min-w-[160px] py-1">
              <q-item
                v-for="opt in localeOptions"
                :key="opt.value"
                v-close-popup
                clickable
                :active="locale === opt.value"
                active-class="text-primary"
                @click="onLocaleChange(opt.value)"
              >
                <q-item-section>{{ opt.label }}</q-item-section>
                <q-item-section v-if="locale === opt.value" side>
                  <q-icon name="check" color="primary" size="18px" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <template v-if="auth.isLoggedIn">
          <q-btn flat round dense class="ml-1" :aria-label="auth.user?.name">
            <q-avatar size="36px" class="kt-avatar">{{ initials }}</q-avatar>
            <q-menu anchor="bottom right" self="top right" :offset="[0, 6]">
              <div class="px-4 pt-3 pb-2 max-w-[260px]">
                <div class="font-semibold ellipsis">{{ auth.user?.name }}</div>
                <div v-if="auth.user?.email" class="text-xs kt-muted ellipsis">
                  {{ auth.user.email }}
                </div>
              </div>
              <q-separator />
              <q-list class="py-1">
                <q-item v-close-popup clickable @click="handleLogout">
                  <q-item-section avatar class="min-w-0 pr-3">
                    <q-icon name="logout" size="20px" color="negative" />
                  </q-item-section>
                  <q-item-section class="text-negative">{{ t('nav.logout') }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </template>
        <q-btn
          v-else
          unelevated
          color="primary"
          class="ml-1"
          icon="login"
          :label="t('nav.login')"
          to="/login"
        />
      </div>
    </q-header>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="$route.path" />
        </transition>
      </router-view>
    </q-page-container>

    <q-footer v-if="isMobile" class="kt-footer">
      <nav class="kt-tabbar">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          replace
          class="kt-tabbar__item"
          :class="{ 'kt-tabbar__item--active': isActive(item) }"
        >
          <span class="kt-tabbar__icon"><q-icon :name="item.icon" size="22px" /></span>
          <span class="kt-tabbar__label">{{ item.label }}</span>
        </router-link>
      </nav>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'stores/auth';
import { setLocale, isMessageLanguage } from 'boot/i18n';

const { t, locale } = useI18n();
const $q = useQuasar();
const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const isMobile = computed(() => $q.screen.lt.md);

const localeOptions = [
  { label: "O'zbek", short: "O'zb", value: 'uz' },
  { label: 'Ўзбек', short: 'Ўзб', value: 'uz-CY' },
  { label: 'Русский', short: 'Рус', value: 'ru' },
];
const currentLocaleLabel = computed(
  () => localeOptions.find((o) => o.value === locale.value)?.short ?? '',
);

interface NavItem {
  to: string;
  icon: string;
  label: string;
  // Ichki sahifalari bo'lgan bo'lim (admin) — prefiks bo'yicha faol
  prefix?: boolean;
}

const navItems = computed<NavItem[]>(() => {
  const items: NavItem[] = [
    { to: '/', icon: 'local_shipping', label: t('nav.loads') },
    { to: '/create-ads', icon: 'add_circle_outline', label: t('nav.addLoad') },
    { to: '/my-ads', icon: 'inventory_2', label: t('nav.myLoads') },
  ];
  if (auth.isAdmin) {
    items.push({ to: '/admin', icon: 'admin_panel_settings', label: t('nav.admin'), prefix: true });
  }
  return items;
});

function isActive(item: NavItem): boolean {
  return item.prefix ? route.path.startsWith(item.to) : route.path === item.to;
}

const initials = computed(() => {
  const name = auth.user?.name?.trim() ?? '';
  const parts = name.split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '') || '?';
});

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

<style scoped>
.kt-header {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: saturate(180%) blur(12px);
  color: var(--kt-text);
  border-bottom: 1px solid var(--kt-border);
}
.kt-header__inner {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 1400px;
  height: var(--kt-header-h);
  margin: 0 auto;
  padding: 0 12px;
}
@media (min-width: 600px) {
  .kt-header__inner {
    padding: 0 20px;
  }
}
.kt-header__btn {
  color: var(--kt-text-2);
  padding: 4px 10px;
}

.kt-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}
.kt-brand__logo {
  width: 36px;
  height: 36px;
}
.kt-brand__name {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--kt-text);
}

.kt-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 24px;
}
.kt-nav__link {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--kt-text-2);
  transition:
    background 0.15s ease,
    color 0.15s ease;
}
.kt-nav__link:hover {
  background: var(--kt-surface-2);
  color: var(--kt-text);
}
.kt-nav__link--active,
.kt-nav__link--active:hover {
  background: var(--kt-primary-soft);
  color: var(--kt-primary);
}

.kt-avatar {
  background: var(--kt-primary-soft);
  color: var(--kt-primary);
  font-size: 14px;
  font-weight: 700;
}

.kt-footer {
  background: var(--kt-surface);
  color: var(--kt-text-2);
  border-top: 1px solid var(--kt-border);
  padding-bottom: env(safe-area-inset-bottom);
}
.kt-tabbar {
  display: flex;
  height: 64px;
}
.kt-tabbar__item {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--kt-muted);
  -webkit-tap-highlight-color: transparent;
}
.kt-tabbar__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 30px;
  border-radius: 999px;
  transition: background 0.2s ease;
}
.kt-tabbar__label {
  max-width: 100%;
  padding: 0 4px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kt-tabbar__item--active {
  color: var(--kt-primary);
}
.kt-tabbar__item--active .kt-tabbar__icon {
  background: var(--kt-primary-soft);
}
</style>
