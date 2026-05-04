<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <q-card v-for="ad in ads" :key="ad._id" class="p-4">
      <div class="flex justify-center gap-1 items-center mb-1">
        <span class="font-bold text-primary">{{ ad.fromAddress }}</span>
        <q-icon class="text-primary" name="arrow_forward" />
        <span class="font-bold text-primary">{{ ad.toAddress }}</span>
      </div>
      <q-badge v-if="ad.isAI" color="purple" class="mb-2">AI</q-badge>

      <q-separator />
      <div class="flex items-center justify-between gap-2 py-1">
        <span class="text-grey-7 text-sm">{{ t('ad.truckLabel') }}</span>
        <span class="text-sm font-medium">{{ ad.truckType?.join(' / ') || '—' }}</span>
      </div>

      <q-separator />
      <div class="flex items-center justify-between gap-2 py-1">
        <span class="text-grey-7 text-sm">{{ t('ad.cargoLabel') }}</span>
        <span class="text-sm">
          {{ [ad.loadName, ad.weight ? ad.weight + ' t' : '', ad.volume ? ad.volume + ' m³' : ''].filter(Boolean).join(', ') || '—' }}
        </span>
      </div>

      <template v-if="ad.descriptions">
        <q-separator />
        <div class="flex items-start justify-between gap-2 py-1">
          <span class="text-grey-7 text-sm">{{ t('ad.extraLabel') }}</span>
          <p class="text-sm text-right">{{ ad.descriptions }}</p>
        </div>
      </template>

      <q-separator />
      <div class="flex items-center justify-between gap-2 py-1">
        <span class="text-grey-7 text-sm">{{ t('ad.paymentLabel') }}</span>
        <span class="text-sm">{{ ad.paymentType || '—' }}</span>
      </div>

      <q-separator />
      <div class="flex items-center justify-between gap-2 py-1">
        <span class="text-grey-7 text-sm">{{ t('ad.advanceLabel') }}</span>
        <span class="text-sm">{{ ad.advance ? ad.advance + ' ' + (ad.currency || '') : '—' }}</span>
      </div>

      <q-separator />
      <div class="flex items-center justify-between gap-2 py-1">
        <span class="text-grey-7 text-sm">{{ t('ad.deliveryCostLabel') }}</span>
        <span class="text-sm">{{ ad.deliveryCost ? ad.deliveryCost + ' ' + (ad.currency || '') : '—' }}</span>
      </div>

      <q-separator />
      <div class="flex items-center justify-between py-2">
        <div class="flex items-center gap-1 text-sm text-grey-7">
          <q-icon name="event" size="16px" />
          {{ ad.loadingTime ? new Date(ad.loadingTime).toLocaleDateString('uz-UZ') : '—' }}
        </div>
        <a class="text-sm text-primary font-medium" :href="'tel:' + ad.phone">{{ ad.phone }}</a>
      </div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { Advertisement } from 'src/types';
defineProps<{ ads: Advertisement[] }>();
const { t } = useI18n();
</script>
