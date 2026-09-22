<template>
  <q-page class="kt-page max-w-[1200px]">
    <div class="kt-page-title mb-4">{{ t('admin.title') }}</div>

    <q-tabs
      dense
      align="left"
      no-caps
      inline-label
      outside-arrows
      mobile-arrows
      class="kt-admin-tabs mb-4"
      active-class="kt-admin-tabs__active"
      indicator-color="transparent"
    >
      <q-route-tab to="/admin/countries" icon="public" :label="t('admin.countries')" />
      <q-route-tab to="/admin/provinces" icon="map" :label="t('admin.provinces')" />
      <q-route-tab to="/admin/cities" icon="location_city" :label="t('admin.cities')" />
      <q-route-tab to="/admin/users" icon="people" :label="t('admin.users')" />
      <q-route-tab to="/admin/telegram" icon="send" :label="t('admin.telegram')" />
    </q-tabs>

    <router-view />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const auth = useAuthStore();
const router = useRouter();

// Asosiy himoya router guard'da (meta.requiresAdmin).
// Bu — ikkinchi qatlam: guard chetlab o'tilsa ham sahifa ochilmaydi.
onMounted(async () => {
  if (!auth.user) await auth.fetchMe();
  if (!auth.isAdmin) {
    void router.replace('/');
  }
});
</script>

<style scoped>
.kt-admin-tabs {
  padding: 4px;
  border: 1px solid var(--kt-border);
  border-radius: 14px;
  background: var(--kt-surface);
  color: var(--kt-text-2);
}
.kt-admin-tabs :deep(.q-tab) {
  min-height: 40px;
  padding: 0 14px;
  border-radius: 10px;
}
.kt-admin-tabs :deep(.q-tab__icon) {
  font-size: 20px;
}
.kt-admin-tabs :deep(.q-tab__label) {
  font-weight: 600;
}
.kt-admin-tabs :deep(.kt-admin-tabs__active) {
  background: var(--kt-primary-soft);
  color: var(--kt-primary);
}
</style>
