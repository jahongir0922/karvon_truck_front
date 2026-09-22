<template>
  <div class="fullscreen flex flex-center p-4 bg-[var(--kt-bg)]">
    <div class="flex flex-col items-center text-center gap-3">
      <div class="kt-404__icon"><q-icon name="wrong_location" size="44px" /></div>
      <div class="kt-404__code">404</div>
      <div class="text-lg kt-muted">{{ t('error.notFound') }}</div>
      <q-btn
        unelevated
        color="primary"
        icon="home"
        class="mt-4 h-12 px-6"
        to="/"
        :label="t('common.goHome')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped>
.kt-404__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  border-radius: 28px;
  background: var(--kt-primary-soft);
  color: var(--kt-primary);
}
.kt-404__code {
  font-size: 72px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--kt-text);
}
</style>
