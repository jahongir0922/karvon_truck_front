<template>
  <div
    ref="root"
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
  >
    <q-card
      v-for="ad in ads"
      :key="ad._id"
      class="ad-card"
      :data-ad-id="ad._id"
      :class="{ 'ad-new': highlightIds?.has(ad._id), 'ad-seen': seenIds.has(ad._id) }"
    >
      <div class="ad-card__head">
        <span class="ad-card__posted" :title="`${t('ad.postedAt')} ${formatDateTime(ad.createdAt, locale)}`">
          <q-icon name="schedule" size="14px" />
          {{ formatDateTime(ad.createdAt, locale) }}
        </span>
        <span v-if="ad.paymentType" class="kt-tag">
          <q-icon name="payments" size="14px" />
          {{ ad.paymentType }}
        </span>
      </div>

      <div class="kt-route">
        <div class="kt-route__point">
          <span class="kt-route__marker"><span class="kt-route__dot" /></span>
          <span class="kt-route__name">{{ ad.fromAddress }}</span>
        </div>
        <div class="kt-route__point">
          <span class="kt-route__marker"><span class="kt-route__pin" /></span>
          <span class="kt-route__name">{{ ad.toAddress }}</span>
        </div>
      </div>

      <!-- Narx — haydovchi birinchi qaraydigan narsa -->
      <div class="ad-card__price q--avoid-card-border">
        <div class="min-w-0">
          <div
            class="ad-card__cost"
            :class="{ 'ad-card__cost--none': !formatMoney(ad.deliveryCost, ad.currency, locale) }"
          >
            {{ formatMoney(ad.deliveryCost, ad.currency, locale) || t('ad.priceNegotiable') }}
          </div>
          <div v-if="formatMoney(ad.advance, ad.currency, locale)" class="ad-card__advance">
            {{ t('ad.advance') }}: {{ formatMoney(ad.advance, ad.currency, locale) }}
          </div>
        </div>
      </div>

      <dl v-if="facts(ad).length" class="ad-card__facts">
        <div v-for="fact in facts(ad)" :key="fact.icon" class="ad-card__fact">
          <dt><q-icon :name="fact.icon" size="16px" />{{ fact.label }}</dt>
          <dd>{{ fact.value }}</dd>
        </div>
      </dl>

      <p v-if="ad.descriptions" class="ad-card__desc">{{ ad.descriptions }}</p>

      <div v-if="ad.sourceText" class="ad-card__source">
        <div class="ad-card__source-label">
          <q-icon name="send" size="14px" />
          {{ t('ad.sourceTitle') }}
        </div>
        <ad-source-text :text="ad.sourceText" @more="openSource(ad.sourceText)" />
      </div>

      <div class="ad-card__actions">
        <q-btn
          outline
          round
          color="grey-7"
          icon="share"
          class="ad-card__share"
          :aria-label="t('common.share')"
          @click="share(ad)"
        >
          <q-tooltip>{{ t('common.share') }}</q-tooltip>
        </q-btn>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="call"
          class="ad-card__call"
          :label="ad.phone"
          :href="'tel:' + ad.phone"
          :aria-label="`${t('ad.call')}: ${ad.phone}`"
        />
      </div>
    </q-card>

    <!-- To'liq asl matn alohida oynada — karta kattalashib ketmasin -->
    <q-dialog v-model="sourceOpen">
      <q-card class="w-full">
        <div class="flex items-center no-wrap gap-2 px-4 pt-3 pb-2">
          <q-icon name="send" color="primary" size="20px" />
          <span class="text-base font-bold">{{ t('ad.sourceTitle') }}</span>
          <q-space />
          <q-btn v-close-popup flat round dense icon="close" :aria-label="t('common.close')" />
        </div>
        <q-card-section class="scroll pt-1" style="max-height: 70vh">
          <div class="whitespace-pre-line break-words text-[15px] leading-relaxed text-grey-9">{{ sourceFull }}</div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { formatDate, formatDateTime, formatMoney } from 'src/utils/format';
import AdSourceText from 'components/AdSourceText.vue';
import type { Advertisement } from 'src/types';

// highlightIds — hozirgina qo'shilgan e'lonlar. Ular ko'rinmaguncha ajralib turadi:
// foydalanuvchi pastdan tepaga o'qib chiqqunicha oqarib ketmasin. Ko'rilib, oqarib bo'lgach
// `seen` chiqadi va egasi id'ni ro'yxatdan olib tashlaydi — karta oddiy oq holatda qoladi.
const props = defineProps<{ ads: Advertisement[]; highlightIds?: ReadonlySet<string> }>();
const emit = defineEmits<{ seen: [id: string] }>();

const $q = useQuasar();
const { t, locale } = useI18n();

// Ajratilgan karta ekranga chiqqach SEEN_DELAY_MS turib, FADE_MS davomida oqaradi (CSS bilan bir xil)
const SEEN_DELAY_MS = 1200;
const FADE_MS = 500;
// Karta ko'rindi deb sanaladi: kamida 40% ko'rinsa yoki (juda uzun karta uchun) shuncha px ko'rinsa
const SEEN_RATIO = 0.4;
const SEEN_MIN_PX = 300;
const root = ref<HTMLElement | null>(null);
const seenIds = ref(new Set<string>());
const seenTimers = new Map<string, ReturnType<typeof setTimeout>>();

const observer =
  typeof IntersectionObserver === 'undefined'
    ? null
    : new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const id = (entry.target as HTMLElement).dataset.adId;
            const visible =
              entry.isIntersecting &&
              (entry.intersectionRatio >= SEEN_RATIO || entry.intersectionRect.height >= SEEN_MIN_PX);
            if (!visible || !id || seenTimers.has(id) || seenIds.value.has(id)) continue;
            seenTimers.set(
              id,
              setTimeout(() => {
                seenIds.value = new Set(seenIds.value).add(id);
                seenTimers.set(
                  id,
                  setTimeout(() => {
                    seenTimers.delete(id);
                    emit('seen', id);
                  }, FADE_MS + 100),
                );
              }, SEEN_DELAY_MS),
            );
          }
        },
        { threshold: [0, 0.1, 0.2, SEEN_RATIO] },
      );

function stopWatchingSeen() {
  observer?.disconnect();
  seenTimers.forEach((timer) => clearTimeout(timer));
  seenTimers.clear();
}

watch(
  () => props.highlightIds,
  async (ids) => {
    observer?.disconnect();
    if (!ids?.size) {
      stopWatchingSeen();
      seenIds.value = new Set();
      return;
    }
    // Kartalar DOM'ga tushgach kuzatamiz
    await nextTick();
    root.value?.querySelectorAll('.ad-new[data-ad-id]').forEach((el) => observer?.observe(el));
  },
);

onBeforeUnmount(stopWatchingSeen);

// Asl matn kartada ko'pi bilan 2 qator ko'rinadi, "Ko'proq" esa to'liq matnni alohida oynada ochadi.
// Oynada e'lon emas, matnning o'zi saqlanadi: real-time yangilanish ochiq oynaga tegmaydi.
const sourceOpen = ref(false);
const sourceFull = ref('');

function openSource(text: string) {
  sourceFull.value = text;
  sourceOpen.value = true;
}

// Kartada faqat to'ldirilgan ma'lumotlar — bo'sh "—" qatorlari o'qishni qiyinlashtiradi
interface Fact {
  icon: string;
  label: string;
  value: string;
}

function facts(ad: Advertisement): Fact[] {
  const clientName = ad.clientName?.trim();
  return [
    { icon: 'local_shipping', label: t('ad.truckType'), value: ad.truckType?.join(' / ') ?? '' },
    { icon: 'inventory_2', label: t('ad.cargoName'), value: cargoText(ad) },
    { icon: 'event', label: t('ad.loadingTime'), value: formatDate(ad.loadingTime, locale.value) },
    {
      icon: 'person',
      label: t('ad.contactLabel').replace(/:\s*$/, ''),
      value: clientName && clientName !== '-' ? clientName : '',
    },
  ].filter((f) => f.value);
}

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

<style scoped>
/* Grid qatoridagi kartalar bo'yi teng — tugmalar hammasida pastda turadi */
.ad-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  padding: 16px;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}
@media (hover: hover) {
  .ad-card:hover {
    box-shadow: var(--kt-shadow-hover);
  }
}
.ad-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 24px;
}
.ad-card__posted {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--kt-muted);
  white-space: nowrap;
}

.ad-card__price {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--kt-surface-2);
}
.ad-card__cost {
  font-size: 18px;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: var(--kt-primary-dark);
  overflow-wrap: anywhere;
}
.ad-card__cost--none {
  font-size: 15px;
  font-weight: 600;
  color: var(--kt-text-2);
}
.ad-card__advance {
  margin-top: 2px;
  font-size: 12px;
  color: var(--kt-muted);
}

.ad-card__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}
.ad-card__fact dt {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--kt-muted);
}
.ad-card__fact dd {
  margin-top: 2px;
  font-size: 14px;
  font-weight: 600;
  color: var(--kt-text);
  overflow-wrap: anywhere;
}

.ad-card__desc {
  font-size: 14px;
  line-height: 1.45;
  color: var(--kt-text-2);
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.ad-card__source-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--kt-muted);
}

.ad-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
}
.ad-card__share {
  flex: none;
}
.ad-card__call {
  flex: 1 1 auto;
  min-width: 0;
  height: 44px;
  font-size: 15px;
}

.ad-new {
  outline: 2px solid var(--q-primary);
  background-color: var(--kt-primary-soft);
}
/* Ko'ringandan keyin oqaradi; oxirgi holat oddiy kartaga teng — sakrash bo'lmaydi */
.ad-new.ad-seen {
  animation: ad-new-fade 1s ease-out forwards;
}
@keyframes ad-new-fade {
  to {
    outline-color: transparent;
    background-color: #fff;
  }
}
</style>
