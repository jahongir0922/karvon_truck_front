<template>
  <q-page class="p-3 max-w-[1100px] mx-auto">
    <div class="text-lg font-bold mb-4">{{ t('admin.title') }}</div>

    <q-tabs dense align="left" class="mb-4">
      <q-route-tab to="/admin/countries" :label="t('admin.countries')" />
      <q-route-tab to="/admin/provinces" :label="t('admin.provinces')" />
      <q-route-tab to="/admin/cities" :label="t('admin.cities')" />
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

onMounted(async () => {
  await auth.fetchMe();
  if (!auth.isAdmin) {
    void router.replace('/');
  }
});
</script>
