<template>
  <main>
    <!-- Filter drawer -->
    <q-drawer v-model="drawerOpen" overlay :width="320" side="right" bordered>
      <div class="p-3">
        <div class="flex justify-between items-center mb-3">
          <span class="font-bold text-lg">{{ t('index.filterTitle') }}</span>
          <q-btn flat dense icon="close" :aria-label="t('common.cancel')" @click="drawerOpen = false" />
        </div>
        <div class="flex flex-col gap-3">
          <!-- Yo'nalish -->
          <div class="flex gap-4">
            <q-radio
              v-model="direction"
              val="international"
              :label="t('ad.international')"
              @update:model-value="onDirectionChange"
            />
            <q-radio
              v-model="direction"
              val="intercity"
              :label="t('ad.intercity')"
              @update:model-value="onDirectionChange"
            />
          </div>

          <!-- Mamlakat (faqat shaharlararo) -->
          <q-select
            v-if="direction === 'intercity'"
            v-model="countryId"
            filled
            use-input
            clearable
            input-debounce="400"
            :label="t('ad.country')"
            :options="countryOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            behavior="menu"
            @filter="filterCountry"
            @update:model-value="onCountryChange"
            @virtual-scroll="onCountryScroll"
          >
            <template #no-option>
              <q-item>
                <q-item-section class="text-grey">{{ t('common.noOption') }}</q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-select
            v-model="filters.fromAddress"
            filled
            use-input
            clearable
            input-debounce="400"
            :label="t('ad.from')"
            :options="fromOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            behavior="menu"
            @filter="filterFrom"
            @virtual-scroll="onFromScroll"
            @update:model-value="onLocationFilterChange"
          >
            <template #option="{ itemProps, opt }">
              <q-item v-bind="itemProps">
                <q-item-section>{{ locationLabel(opt.label) }}</q-item-section>
              </q-item>
            </template>
            <template #no-option>
              <q-item>
                <q-item-section class="text-grey">{{ t('common.noOption') }}</q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-select
            v-model="filters.toAddress"
            filled
            use-input
            clearable
            input-debounce="400"
            :label="t('ad.to')"
            :options="toOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            behavior="menu"
            @filter="filterTo"
            @virtual-scroll="onToScroll"
            @update:model-value="onLocationFilterChange"
          >
            <template #option="{ itemProps, opt }">
              <q-item v-bind="itemProps">
                <q-item-section>{{ locationLabel(opt.label) }}</q-item-section>
              </q-item>
            </template>
            <template #no-option>
              <q-item>
                <q-item-section class="text-grey">{{ t('common.noOption') }}</q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-select
            v-model="filters.truckType"
            filled
            clearable
            multiple
            use-chips
            :label="t('ad.truckType')"
            :options="TRUCK_TYPES"
            behavior="menu"
          />
          <div class="grid grid-cols-2 gap-2">
            <q-input v-model.number="filters.priceFrom" :label="t('index.minPrice')" type="number" />
            <q-input v-model.number="filters.priceTo" :label="t('index.maxPrice')" type="number" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <q-input v-model.number="filters.weightFrom" :label="t('index.minWeight')" type="number" />
            <q-input v-model.number="filters.weightTo" :label="t('index.maxWeight')" type="number" />
          </div>
          <q-btn color="primary" :label="t('common.apply')" @click="drawerOpen = false" />
          <q-btn flat :label="t('common.clear')" @click="resetFilters" />
        </div>
      </div>
    </q-drawer>

    <q-page class="p-3">
      <!-- Direction selection screen -->
      <div v-if="!directionChosen" class="flex flex-col h-[85vh] justify-center items-center gap-4">
        <div class="text-xl font-bold text-center">{{ t('index.chooseDirection') }}</div>
        <div class="flex gap-4">
          <q-radio v-model="direction" val="international" :label="t('ad.international')" />
          <q-radio v-model="direction" val="intercity" :label="t('ad.intercity')" />
        </div>
        <q-btn
          color="primary"
          :label="t('index.continue')"
          class="min-w-[150px]"
          @click="confirmDirection"
        />
      </div>

      <!-- Ads view -->
      <template v-else>
        <div class="flex gap-2 mb-3 items-center flex-wrap">
          <div class="flex gap-4">
            <q-radio
              v-model="direction"
              val="international"
              :label="t('ad.international')"
              @update:model-value="onDirectionChange"
            />
            <q-radio
              v-model="direction"
              val="intercity"
              :label="t('ad.intercity')"
              @update:model-value="onDirectionChange"
            />
          </div>
          <q-space />
          <q-icon
            :name="wsConnected ? 'wifi' : 'wifi_off'"
            :color="wsConnected ? 'positive' : 'grey'"
            size="18px"
          >
            <q-tooltip>{{ wsConnected ? t('index.liveOn') : t('index.liveOff') }}</q-tooltip>
          </q-icon>
          <q-btn
            flat
            dense
            round
            icon="refresh"
            :loading="loading"
            :aria-label="t('common.refresh')"
            @click="loadAds"
          >
            <q-tooltip>{{ t('common.refresh') }}</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            round
            icon="filter_list"
            :aria-label="t('index.filterTitle')"
            @click="drawerOpen = true"
          >
            <q-badge v-if="activeFilterCount > 0" color="negative" floating>
              {{ activeFilterCount }}
            </q-badge>
          </q-btn>
        </div>

        <q-input
          v-model="filters.q"
          dense
          outlined
          clearable
          debounce="300"
          :placeholder="t('index.searchPlaceholder')"
          class="mb-2"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>

        <div v-if="allAds.length" class="text-xs text-grey-6 mb-3">
          {{ t('index.shown', { n: filteredAds.length }) }}
        </div>

        <div v-if="!allAds.length && !loading" class="text-center text-grey-6 py-10">
          {{ t('index.noAds') }}
        </div>

        <ads-card :ads="filteredAds" :highlight-ids="highlightIds" @seen="onAdSeen" />

        <div v-if="filteredAds.length === 0 && allAds.length > 0" class="text-center text-grey-6 py-10">
          {{ t('index.noFilteredAds') }}
        </div>

        <div v-if="hasMore" class="flex justify-center py-4">
          <q-btn
            flat
            color="primary"
            :label="t('index.loadMore')"
            :loading="loadingMore"
            @click="loadMoreAds"
          />
        </div>
      </template>

      <!-- Yangi e'lonlar ro'yxatni siljitmasligi uchun o'zi qo'shilmaydi — shu tugma bilan qo'shiladi -->
      <q-page-sticky position="top" :offset="[0, 12]">
        <transition name="new-ads">
          <q-btn
            v-if="hasNewAds"
            rounded
            no-caps
            color="primary"
            icon="arrow_upward"
            class="shadow-4"
            :label="t('index.newAds', { n: newAdsLabel })"
            @click="showNewAds"
          />
        </transition>
      </q-page-sticky>
    </q-page>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, reactive, nextTick, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import AdsCard from 'components/AdsCard.vue';
import { apiGetAds, type AdsQuery, type LocationResult } from 'src/api';
import { useLocationSearch } from 'src/composables/useLocationSearch';
import { useCountrySelect } from 'src/composables/useCountrySelect';
import { stripCountry } from 'src/utils/location';
import { DIRECTION_KEY, TRUCK_TYPES, isDirection, type Direction } from 'src/constants';
import type { Advertisement, AdLocationRef } from 'src/types';

const { t } = useI18n();

function locationLabel(label: string) {
  return direction.value === 'intercity' ? stripCountry(label) : label;
}

// ─── Direction ────────────────────────────────────────────────────────────────
const savedDirection = localStorage.getItem(DIRECTION_KEY);
const direction = ref<Direction>(isDirection(savedDirection) ? savedDirection : 'intercity');
const directionChosen = ref(isDirection(savedDirection));

// ─── Country selector ─────────────────────────────────────────────────────────
const { countryId, countryOptions, loadDefaultCountry, filterCountry, onCountryScroll } =
  useCountrySelect();

function onCountryChange() {
  filters.fromAddress = '';
  filters.toAddress = '';
  void loadInitial();
}

// ─── Location search ──────────────────────────────────────────────────────────
const {
  fromOptions, toOptions,
  fromHasMore, toHasMore,
  loadInitial, filterFrom, filterTo,
  loadMoreFrom, loadMoreTo,
  pickLocation,
} = useLocationSearch(
  () => direction.value,
  () => (direction.value === 'intercity' && countryId.value ? countryId.value : undefined),
);

function onFromScroll(details: { to: number }) {
  if (details.to >= fromOptions.value.length - 3 && fromHasMore.value) void loadMoreFrom();
}
function onToScroll(details: { to: number }) {
  if (details.to >= toOptions.value.length - 3 && toHasMore.value) void loadMoreTo();
}

function reloadLocations() {
  if (direction.value === 'intercity') {
    void loadDefaultCountry().then(() => loadInitial());
  } else {
    void loadInitial();
  }
}

// ─── Ads ──────────────────────────────────────────────────────────────────────
const drawerOpen = ref(false);
const loading = ref(false);
const allAds = ref<Advertisement[]>([]);

// Sahifalash. Yo'nalish serverda filtrlanadi, qolgan filtrlar mijoz tomonida —
// "ko'proq yuklash" ko'proq xom e'lon oladi va filtr ular ustidan qayta hisoblanadi.
const PER_PAGE = 50;
const page = ref(1);
const hasMore = ref(false);
const loadingMore = ref(false);
// Yo'nalish tez almashtirilganda eski javob yangisini bosib qo'ymasin
let loadSeq = 0;

// WebSocket'dan kelgan yangi e'lonlar ekrandagi ro'yxatni siljitmasligi uchun avval shu yerga
// tushadi; foydalanuvchi "yangi e'lonlar" tugmasini bosganda ro'yxatga qo'shiladi.
const MAX_PENDING = 100;
const pendingAds = ref<Advertisement[]>([]);
// Bufer to'lib, eskilari tashlangan — bo'shliq qolmasligi uchun tugma ro'yxatni serverdan qayta oladi
const pendingOverflow = ref(false);
// Tugma bosilgach qo'shilgan, hali ko'rilmagan e'lonlar. AdsCard ko'rilganini xabar qilgach id olinadi
const highlightIds = ref(new Set<string>());

// clearable q-input/q-select tozalanganda null beradi — shuning uchun `| null`
interface Filters {
  q: string | null;
  fromAddress: string | null;
  toAddress: string | null;
  truckType: string[] | null;
  priceFrom: number | null;
  priceTo: number | null;
  weightFrom: number | null;
  weightTo: number | null;
}

const filters = reactive<Filters>({
  q: '',
  fromAddress: '',
  toAddress: '',
  truckType: [],
  priceFrom: null,
  priceTo: null,
  weightFrom: null,
  weightTo: null,
});

// ─── Computed ─────────────────────────────────────────────────────────────────
const activeFilterCount = computed(() => {
  let n = 0;
  if (filters.fromAddress) n++;
  if (filters.toAddress) n++;
  if (filters.truckType?.length) n++;
  if (typeof filters.priceFrom === 'number') n++;
  if (typeof filters.priceTo === 'number') n++;
  if (typeof filters.weightFrom === 'number') n++;
  if (typeof filters.weightTo === 'number') n++;
  return n;
});

// Tanlangan manzil (ID'lari bilan). Bazadagi e'lon manzili "TOSHKENT" yoki
// "Uzbekistan, Tashkent" deb yozilgan bo'lsa ham, taqqoslash ID bo'yicha ketadi.
const selectedFrom = computed<LocationResult | null>(() => pickLocation(filters.fromAddress));
const selectedTo = computed<LocationResult | null>(() => pickLocation(filters.toAddress));

function locationQuery(): Pick<AdsQuery, 'fromProvinceId' | 'fromCityId' | 'toProvinceId' | 'toCityId'> {
  const q: Pick<AdsQuery, 'fromProvinceId' | 'fromCityId' | 'toProvinceId' | 'toCityId'> = {};
  const f = selectedFrom.value;
  const t = selectedTo.value;
  if (f?.cityId) q.fromCityId = f.cityId;
  else if (f?.provinceId) q.fromProvinceId = f.provinceId;
  if (t?.cityId) q.toCityId = t.cityId;
  else if (t?.provinceId) q.toProvinceId = t.provinceId;
  return q;
}

// WebSocket orqali kelgan e'lonlar server filtridan o'tmagan — mijozda ham tekshiramiz
function matchesLocation(
  loc: AdLocationRef | null | undefined,
  text: string,
  selected: LocationResult | null,
  rawFilter: string,
): boolean {
  if (!rawFilter) return true;
  if (selected) {
    if (!loc) return false;
    return selected.cityId ? loc.cityId === selected.cityId : loc.provinceId === selected.provinceId;
  }
  return text.toLowerCase().includes(rawFilter.toLowerCase());
}

function onLocationFilterChange() {
  void loadAds();
}

function matchesText(ad: Advertisement, q: string): boolean {
  const haystack = [
    ad.fromAddress,
    ad.toAddress,
    ad.loadName,
    ad.descriptions,
    ad.clientName,
    ad.paymentType,
    ...(ad.truckType ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

// Joriy filtrga mos kelish sharti — ro'yxat ham, yangi e'lonlar hisobi ham shundan foydalanadi
const adMatches = computed(() => {
  const q = (filters.q ?? '').trim().toLowerCase();
  const from = (filters.fromAddress ?? '').toLowerCase();
  const to = (filters.toAddress ?? '').toLowerCase();
  const trucks = filters.truckType ?? [];

  return (ad: Advertisement): boolean => {
    if (ad.direction !== direction.value) return false;
    if (q && !matchesText(ad, q)) return false;
    if (!matchesLocation(ad.fromLocation, ad.fromAddress, selectedFrom.value, from)) return false;
    if (!matchesLocation(ad.toLocation, ad.toAddress, selectedTo.value, to)) return false;
    if (trucks.length && !trucks.some((type) => ad.truckType?.includes(type))) return false;
    const cost = Number(ad.deliveryCost);
    if (typeof filters.priceFrom === 'number' && cost < filters.priceFrom) return false;
    if (typeof filters.priceTo === 'number' && cost > filters.priceTo) return false;
    const w = Number(ad.weight);
    if (typeof filters.weightFrom === 'number' && w < filters.weightFrom) return false;
    if (typeof filters.weightTo === 'number' && w > filters.weightTo) return false;
    return true;
  };
});

const filteredAds = computed(() => allAds.value.filter(adMatches.value));

// Buferdagi, ro'yxatda hali yo'q va joriy filtrga mos e'lonlar
const newAds = computed(() => {
  const shown = new Set(allAds.value.map((a) => a._id));
  return pendingAds.value.filter((a) => !shown.has(a._id) && adMatches.value(a));
});
const hasNewAds = computed(() => pendingOverflow.value || newAds.value.length > 0);
const newAdsLabel = computed(() =>
  pendingOverflow.value ? `${MAX_PENDING}+` : String(newAds.value.length),
);

// ─── Methods ──────────────────────────────────────────────────────────────────
function confirmDirection() {
  localStorage.setItem(DIRECTION_KEY, direction.value);
  directionChosen.value = true;
  void loadAds();
  reloadLocations();
}

function onDirectionChange() {
  localStorage.setItem(DIRECTION_KEY, direction.value);
  countryId.value = null;
  filters.fromAddress = '';
  filters.toAddress = '';
  resetFilters();
  void loadAds();
  reloadLocations();
}

async function loadAds() {
  const seq = ++loadSeq;
  loading.value = true;
  page.value = 1;
  try {
    const res = await apiGetAds({
      page: 1,
      perPage: PER_PAGE,
      direction: direction.value,
      ...locationQuery(),
    });
    if (seq !== loadSeq) return; // eskirgan javob
    allAds.value = res.data.data;
    hasMore.value = res.data.data.length === PER_PAGE;
    // Ro'yxat serverdan yangilandi — bufer ham, ajratilgan kartalar ham eskirdi
    highlightIds.value = new Set();
    pendingAds.value = [];
    pendingOverflow.value = false;
    needsReload = false;
  } catch {
    // Tarmoq/server xatosini interceptor ko'rsatadi
    needsReload = true;
  } finally {
    if (seq === loadSeq) loading.value = false;
  }
}

async function loadMoreAds() {
  if (loadingMore.value || !hasMore.value) return;
  loadingMore.value = true;
  try {
    const next = page.value + 1;
    const res = await apiGetAds({
      page: next,
      perPage: PER_PAGE,
      direction: direction.value,
      ...locationQuery(),
    });
    const incoming = res.data.data;
    // WebSocket orqali allaqachon tushganlarini takrorlamaymiz
    const fresh = incoming.filter((a) => !allAds.value.some((x) => x._id === a._id));
    allAds.value = [...allAds.value, ...fresh];
    page.value = next;
    hasMore.value = incoming.length === PER_PAGE;
  } catch {
    // interceptor ko'rsatadi
  } finally {
    loadingMore.value = false;
  }
}

function resetFilters() {
  const hadLocation = !!(filters.fromAddress || filters.toAddress);
  filters.q = '';
  filters.fromAddress = '';
  filters.toAddress = '';
  filters.truckType = [];
  filters.priceFrom = null;
  filters.priceTo = null;
  filters.weightFrom = null;
  filters.weightTo = null;
  if (hadLocation) void loadAds();
}

// ─── WebSocket ────────────────────────────────────────────────────────────────
interface AdSocketMessage {
  type: 'initial_ads' | 'ad_change';
  data: Advertisement | Advertisement[] | null;
  documentKey?: { _id: string } | null;
  operation?: string;
}

const RECONNECT_MS = 5000;
const wsConnected = ref(false);
let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let disposed = false;
let everConnected = false;
// REST yuklash muvaffaqiyatsiz bo'lgan bo'lsa (masalan, backend hali uyg'onmagan),
// socket ulanishi bilan ro'yxatni qayta so'raymiz
let needsReload = false;

function removePending(id: string) {
  const idx = pendingAds.value.findIndex((x) => x._id === id);
  if (idx >= 0) pendingAds.value.splice(idx, 1);
}

function removeAd(id: string) {
  const idx = allAds.value.findIndex((x) => x._id === id);
  if (idx >= 0) allAds.value.splice(idx, 1);
  removePending(id);
}

// Yangi e'lonni ro'yxatga emas, buferga qo'shadi — o'qilayotgan kartalar joyidan siljimasin.
// Ekranda ko'rinadigan e'lon bo'lmasa o'quvchi ham yo'q — u to'g'ridan-to'g'ri ro'yxatga tushadi.
function queueAd(ad: Advertisement) {
  if (!filteredAds.value.length) {
    removePending(ad._id);
    allAds.value.unshift(ad);
    return;
  }
  const idx = pendingAds.value.findIndex((x) => x._id === ad._id);
  if (idx >= 0) {
    pendingAds.value.splice(idx, 1, ad);
    return;
  }
  pendingAds.value.unshift(ad);
  if (pendingAds.value.length > MAX_PENDING) {
    pendingAds.value.length = MAX_PENDING;
    pendingOverflow.value = true;
  }
}

function upsertAd(ad: Advertisement) {
  // Nofaol qilingan e'lon ro'yxatda qolib ketmasin (REST ro'yxati ham uni bermaydi)
  if (ad.isActive === false) {
    removeAd(ad._id);
    return;
  }
  const idx = allAds.value.findIndex((x) => x._id === ad._id);
  // Ekrandagi e'lon tahrirlansa joyida yangilanadi — kartalar siljimaydi
  if (idx >= 0) allAds.value.splice(idx, 1, ad);
  else queueAd(ad);
}

// Yangi e'lonlarni eskilariga qo'shib ajratadi: oldingi to'plamdan hali ko'rilmaganlari ham
// ko'rilmaguncha ko'k qoladi. Yangilarning id'lari qaytadi.
function highlightNew(before: Set<string>): Set<string> {
  const fresh = new Set(filteredAds.value.filter((a) => !before.has(a._id)).map((a) => a._id));
  highlightIds.value = new Set([...highlightIds.value, ...fresh]);
  return fresh;
}

// AdsCard karta ko'rilib, oqarib bo'lganini xabar qiladi — u endi oddiy oq karta
function onAdSeen(id: string) {
  const next = new Set(highlightIds.value);
  if (next.delete(id)) highlightIds.value = next;
}

// Yangilar ichidagi eng oxirgisini (eng eskisini) ekranning pastiga qo'yadi: eng yangisi tepada
// qoladi, foydalanuvchi esa pastdan tepaga qarab o'qiydi. Silliq emas, bir zumda o'tamiz —
// aks holda tugma bosilganda sahifa ko'z o'ngida pastga "yuguradi".
function jumpToLastNew(fresh: Set<string>) {
  const lastId = [...filteredAds.value].reverse().find((a) => fresh.has(a._id))?._id;
  const card = lastId ? document.querySelector<HTMLElement>(`[data-ad-id="${lastId}"]`) : null;
  if (!card) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    return;
  }
  // Pastki panel (q-footer) kartani yopib qo'ymasin
  const footerH = document.querySelector<HTMLElement>('.q-footer')?.offsetHeight ?? 0;
  const gap = 16;
  const top = window.scrollY + card.getBoundingClientRect().bottom - (window.innerHeight - footerH - gap);
  window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
}

// "Yangi e'lonlar" tugmasi: buferdagilarni ro'yxat boshiga qo'shadi va ularning oxirgisiga o'tkazadi.
// Yangilar ko'rinmaguncha ajralib turadi (AdsCard), shuning uchun tepaga o'qib chiqishga ulguriladi.
async function showNewAds() {
  const before = new Set(allAds.value.map((a) => a._id));
  if (pendingOverflow.value) {
    // Bufer to'lib ketgan — bo'shliq qolmasligi uchun ro'yxatni serverdan qayta olamiz
    await loadAds();
  } else {
    allAds.value = [...pendingAds.value.filter((a) => !before.has(a._id)), ...allAds.value];
    pendingAds.value = [];
  }
  const fresh = highlightNew(before);
  // Scroll'ni DOM yangilangandan keyin qilamiz: tepadan qo'shilgan kartalar sahifani siljitadi
  // (scroll anchoring), o'lchov esa yangi joylashuvdan olinishi kerak
  await nextTick();
  jumpToLastNew(fresh);
}

function handleSocketMessage(msg: AdSocketMessage) {
  if (msg.type === 'initial_ads') {
    const incoming = Array.isArray(msg.data) ? msg.data : [];
    // Eng yangisi tepada turishi uchun teskari tartibda qo'shamiz
    for (const ad of [...incoming].reverse()) {
      if (!allAds.value.some((x) => x._id === ad._id)) queueAd(ad);
    }
    return;
  }

  if (msg.type === 'ad_change') {
    // O'chirishda serverda fullDocument bo'lmaydi — id documentKey'dan olinadi
    if (msg.operation === 'delete') {
      if (msg.documentKey?._id) removeAd(String(msg.documentKey._id));
      return;
    }
    if (msg.data && !Array.isArray(msg.data)) upsertAd(msg.data);
  }
}

function scheduleReconnect() {
  if (disposed || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    setupWebSocket();
  }, RECONNECT_MS);
}

function setupWebSocket() {
  if (disposed) return;
  const wsUrl = (process.env.WS_URL || 'ws://localhost:5000/ws/') + 'ads';
  try {
    ws = new WebSocket(wsUrl);
  } catch {
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    wsConnected.value = true;
    // Uzilib turgan paytda o'tkazib yuborilgan o'zgarishlarni, yoki backend
    // kech uyg'ongani uchun yuklanmay qolgan ro'yxatni qayta olamiz
    if (directionChosen.value && (everConnected || needsReload)) void loadAds();
    everConnected = true;
  };

  ws.onmessage = (event) => {
    let msg: AdSocketMessage;
    try {
      msg = JSON.parse(String(event.data)) as AdSocketMessage;
    } catch {
      return; // buzilgan xabar — e'tiborsiz
    }
    handleSocketMessage(msg);
  };

  // Uzilganda qayta ulanamiz, lekin sahifa yopilgandan keyin emas
  ws.onclose = () => {
    wsConnected.value = false;
    scheduleReconnect();
  };
}

// Komponent yo'q qilinganda socketni ham, qayta ulanish taymerini ham to'xtatamiz.
// Aks holda har safar sahifaga qaytganda yangi socket qo'shilib boraveradi.
function teardownWebSocket() {
  disposed = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.onopen = null;
    ws.onclose = null;
    ws.onmessage = null;
    ws.close();
    ws = null;
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(() => {
  if (directionChosen.value) {
    void loadAds();
    reloadLocations();
  }
  setupWebSocket();
});

onUnmounted(() => {
  teardownWebSocket();
});
</script>

<style scoped>
/* "Yangi e'lonlar" tugmasi paydo bo'lishi va yo'qolishi */
.new-ads-enter-active,
.new-ads-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.new-ads-enter-from,
.new-ads-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
