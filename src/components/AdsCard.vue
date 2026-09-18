<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <q-card v-for="ad in ads" :key="ad._id" class="p-4">
      <div class="flex justify-center gap-1 items-center mb-1 text-center">
        <span class="font-bold text-primary">{{ ad.fromAddress }}</span>
        <q-icon class="text-primary" name="arrow_forward" />
        <span class="font-bold text-primary">{{ ad.toAddress }}</span>
      </div>
      <div class="flex justify-center gap-1 mb-2">
        <q-badge :color="ad.direction === 'international' ? 'teal' : 'blue-grey'" outline>
          {{ ad.direction === 'international' ? t('ad.international') : t('ad.intercity') }}
        </q-badge>
        <q-badge v-if="ad.isAI" color="purple">AI</q-badge>
      </div>

      <q-separator />
      <div class="flex items-center justify-between gap-2 py-1">
        <span class="text-grey-7 text-sm">{{ t('ad.truckLabel') }}</span>
        <span class="text-sm font-medium text-right">{{ ad.truckType?.join(' / ') || '—' }}</span>
      </div>

      <q-separator />
      <div class="flex items-center justify-between gap-2 py-1">
        <span class="text-grey-7 text-sm">{{ t('ad.cargoLabel') }}</span>
        <span class="text-sm text-right">{{ cargoText(ad) || '—' }}</span>
      </div>

      <template v-if="ad.descriptions">
        <q-separator />
        <div class="flex items-start justify-between gap-2 py-1">
          <span class="text-grey-7 text-sm">{{ t('ad.extraLabel') }}</span>
          <p class="text-sm text-right whitespace-pre-line">{{ ad.descriptions }}</p>
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
        <span class="text-sm">{{ formatMoney(ad.advance, ad.currency, locale) || '—' }}</span>
      </div>

      <q-separator />
      <div class="flex items-center justify-between gap-2 py-1">
        <span class="text-grey-7 text-sm">{{ t('ad.deliveryCostLabel') }}</span>
        <span class="text-sm font-medium">
          {{ formatMoney(ad.deliveryCost, ad.currency, locale) || '—' }}
        </span>
      </div>

      <q-separator />
      <div class="flex items-center justify-between gap-2 py-1">
        <div class="flex items-center gap-1 text-sm text-grey-7">
          <q-icon name="event" size="16px" />
          {{ formatDate(ad.loadingTime, locale) || '—' }}
        </div>
        <div class="flex items-center gap-1">
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="share"
            :aria-label="t('common.share')"
            @click="share(ad)"
          >
            <q-tooltip>{{ t('common.share') }}</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            no-caps
            color="primary"
            icon="call"
            :label="ad.phone"
            :href="'tel:' + ad.phone"
            :aria-label="t('ad.call')"
          />
        </div>
      </div>

      <div class="flex items-center justify-between gap-2 text-xs text-grey-6 pt-1">
        <span v-if="ad.clientName">{{ t('ad.contactLabel') }} {{ ad.clientName }}</span>
        <span class="ml-auto">{{ t('ad.postedAt') }} {{ formatDateTime(ad.createdAt, locale) }}</span>
      </div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { formatDate, formatDateTime, formatMoney } from 'src/utils/format';
import type { Advertisement } from 'src/types';

defineProps<{ ads: Advertisement[] }>();

const $q = useQuasar();
const { t, locale } = useI18n();

function cargoText(ad: Advertisement): string {
  return [ad.loadName, ad.weight ? `${ad.weight} t` : '', ad.volume ? `${ad.volume} m³` : '']
    .filter(Boolean)
    .join(', ');
}

function shareText(ad: Advertisement): string {
  const lines = [
    `${ad.fromAddress} → ${ad.toAddress}`,
    ad.truckType?.length ? `${t('ad.truckLabel')} ${ad.truckType.join(' / ')}` : '',
    cargoText(ad) ? `${t('ad.cargoLabel')} ${cargoText(ad)}` : '',
    ad.deliveryCost
      ? `${t('ad.deliveryCostLabel')} ${formatMoney(ad.deliveryCost, ad.currency, locale.value)}`
      : '',
    ad.loadingTime ? `${t('ad.loadingTime')}: ${formatDate(ad.loadingTime, locale.value)}` : '',
    `${t('ad.phone')}: ${ad.phone}`,
  ];
  return lines.filter(Boolean).join('\n');
}

// Telefonda tizim "ulashish" oynasi, kompyuterda — buferga nusxalash
async function share(ad: Advertisement) {
  const text = shareText(ad);
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'Karvon Truck', text });
      return;
    } catch (err) {
      // Foydalanuvchi bekor qilgan bo'lsa — jim; qo'llanmasa — nusxalashga o'tamiz
      if (err instanceof DOMException && err.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    $q.notify({ type: 'positive', message: t('common.copied') });
  } catch {
    $q.notify({ type: 'negative', message: t('common.error') });
  }
}
</script>
