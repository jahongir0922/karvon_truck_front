<template>
  <main>
    <!-- Filter drawer -->
    <q-drawer v-model="drawerOpen" overlay :width="340" side="right" class="kt-filter">
      <div class="kt-filter__inner">
        <div class="kt-filter__head">
          <div class="kt-section-title text-lg">
            <q-icon name="tune" size="22px" />
            {{ t('index.filterTitle') }}
          </div>
          <q-btn flat round dense icon="close" :aria-label="t('common.close')" @click="drawerOpen = false" />
        </div>

        <div class="kt-filter__body">
          <!-- Yo'nalish -->
          <q-btn-toggle
            v-model="direction"
            spread
            no-caps
            unelevated
            class="kt-segment"
            toggle-color="primary"
            color="white"
            text-color="grey-8"
            :options="directionOptions"
            @update:model-value="onDirectionChange"
          />

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
            <template #prepend><q-icon name="flag" size="20px" /></template>
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
            <template #prepend><q-icon name="trip_origin" color="primary" size="20px" /></template>
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
            <template #prepend><q-icon name="place" color="accent" size="20px" /></template>
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
          >
            <template #prepend><q-icon name="local_shipping" size="20px" /></template>
          </q-select>

          <div class="grid grid-cols-2 gap-2">
            <q-input v-model.number="filters.priceFrom" filled :label="t('index.minPrice')" type="number" />
            <q-input v-model.number="filters.priceTo" filled :label="t('index.maxPrice')" type="number" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <q-input v-model.number="filters.weightFrom" filled :label="t('index.minWeight')" type="number" />
            <q-input v-model.number="filters.weightTo" filled :label="t('index.maxWeight')" type="number" />
          </div>
        </div>

        <div class="kt-filter__foot">
          <q-btn outline color="grey-8" class="flex-1" :label="t('common.clear')" @click="resetFilters" />
          <q-btn unelevated color="primary" class="flex-[2]" :label="t('common.apply')" @click="drawerOpen = false" />
        </div>
      </div>
    </q-drawer>

    <q-page class="kt-page">
      <!-- Direction selection screen -->
      <div v-if="!directionChosen" class="kt-choose">
        <div class="kt-choose__icon"><q-icon name="local_shipping" size="40px" /></div>
        <div class="kt-page-title text-center">{{ t('index.chooseDirection') }}</div>
        <div class="kt-page-subtitle text-center">{{ t('index.chooseDirectionHint') }}</div>
        <div class="kt-choose__options">
          <button
            v-for="opt in directionCards"
            :key="opt.value"
            type="button"
            class="kt-choose__card"
            @click="chooseDirection(opt.value)"
          >
            <span class="kt-choose__card-icon" :class="`kt-choose__card-icon--${opt.value}`">
              <q-icon :name="opt.icon" size="28px" />
            </span>
            <span class="min-w-0 flex-1 text-left">
              <span class="block text-base font-bold text-[var(--kt-text)]">{{ opt.label }}</span>
              <span class="block text-sm kt-muted">{{ opt.hint }}</span>
            </span>
            <q-icon name="chevron_right" size="24px" class="kt-muted" />
          </button>
        </div>
      </div>

      <!-- Ads view -->
      <template v-else>
        <div class="kt-toolbar">
          <q-btn-toggle
            v-model="direction"
            no-caps
            unelevated
            :spread="$q.screen.lt.lg"
            class="kt-segment kt-toolbar__direction"
            toggle-color="primary"
            color="white"
            text-color="grey-8"
            :options="directionOptions"
            @update:model-value="onDirectionChange"
          />

          <q-input
            v-model="filters.q"
            filled
            dense
            clearable
            debounce="300"
            :placeholder="t('index.searchPlaceholder')"
            class="kt-toolbar__search"
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>

          <div class="kt-toolbar__actions">
            <q-btn
              unelevated
              no-caps
              class="kt-filter-btn"
              :class="{ 'kt-filter-btn--active': activeFilterCount > 0 }"
              icon="tune"
              :label="$q.screen.gt.xs ? t('index.filterTitle') : undefined"
              :aria-label="t('index.filterTitle')"
              @click="drawerOpen = true"
            >
              <q-badge v-if="activeFilterCount > 0" color="primary" floating rounded>
                {{ activeFilterCount }}
              </q-badge>
            </q-btn>
            <q-btn
              flat
              round
              icon="refresh"
              color="grey-8"
              :loading="loading"
              :aria-label="t('common.refresh')"
              @click="loadAds"
            >
              <q-tooltip>{{ t('common.refresh') }}</q-tooltip>
            </q-btn>
          </div>
        </div>

        <div class="kt-summary">
          <span v-if="allAds.length" class="kt-muted">
            {{ t('index.shown', { n: filteredAds.length }) }}
          </span>
          <q-space />
          <span class="kt-live" :class="{ 'kt-live--on': wsConnected }">
            <span class="kt-live__dot" />
            {{ t('index.live') }}
            <q-tooltip>{{ wsConnected ? t('index.liveOn') : t('index.liveOff') }}</q-tooltip>
          </span>
        </div>

        <!-- Faol filtrlar: bir bosishda olib tashlash mumkin -->
        <div v-if="filterChips.length" class="kt-chips">
          <q-chip
            v-for="chip in filterChips"
            :key="chip.key"
            removable
            class="kt-chip"
            :icon="chip.icon"
            @remove="chip.remove()"
          >
            {{ chip.label }}
          </q-chip>
          <q-btn flat dense no-caps size="sm" color="primary" :label="t('common.clear')" @click="resetFilters" />
        </div>

        <!-- Birinchi yuklanish: kartalar o'rnida skelet -->
        <div
          v-if="loading && !allAds.length"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
        >
          <q-card v-for="n in 8" :key="n" class="p-4 flex flex-col gap-3">
            <q-skeleton type="text" width="40%" />
            <q-skeleton type="text" width="80%" height="22px" />
            <q-skeleton type="text" width="70%" height="22px" />
            <q-skeleton height="56px" class="rounded-xl" />
            <q-skeleton type="text" width="60%" />
            <q-skeleton height="44px" class="rounded-xl" />
          </q-card>
        </div>

        <div v-else-if="!allAds.length && !loading" class="kt-empty">
          <div class="kt-empty__icon"><q-icon name="inventory_2" size="34px" /></div>
          <div class="kt-empty__title">{{ t('index.noAds') }}</div>
        </div>

        <ads-card :ads="filteredAds" :highlight-ids="highlightIds" @seen="onAdSeen" />

        <div v-if="filteredAds.length === 0 && allAds.length > 0" class="kt-empty">
          <div class="kt-empty__icon"><q-icon name="search_off" size="34px" /></div>
          <div class="kt-empty__title">{{ t('index.noFilteredAds') }}</div>
          <q-btn outline color="primary" class="mt-2" :label="t('common.clear')" @click="resetFilters" />
        </div>

        <div v-if="hasMore" class="flex justify-center pt-6 pb-2">
          <q-btn
            outline
            color="primary"
            icon="expand_more"
            class="px-4"
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
            v-if="hasNewAds && directionChosen"
            rounded
            no-caps
            unelevated
            color="primary"
            icon="arrow_upward"
            class="kt-new-ads"
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

const directionOptions = computed(() => [
  { value: 'intercity', label: t('ad.intercity'), icon: 'alt_route' },
  { value: 'international', label: t('ad.international'), icon: 'public' },
]);
const directionCards = computed(() => [
  { value: 'intercity' as const, label: t('ad.intercity'), hint: t('index.intercityHint'), icon: 'alt_route' },
  { value: 'international' as const, label: t('ad.international'), hint: t('index.internationalHint'), icon: 'public' },
]);

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

// Faol filtrlar chip ko'rinishida — har birini alohida olib tashlash mumkin
interface FilterChip {
  key: string;
  icon: string;
  label: string;
  remove: () => void;
}

function rangeLabel(from: number | null, to: number | null, unit = ''): string {
  const hasFrom = typeof from === 'number';
  const hasTo = typeof to === 'number';
  if (hasFrom && hasTo) return `${from} – ${to}${unit}`;
  if (hasFrom) return `≥ ${from}${unit}`;
  return `≤ ${to}${unit}`;
}

const filterChips = computed<FilterChip[]>(() => {
  const chips: FilterChip[] = [];
  if (filters.fromAddress) {
    chips.push({
      key: 'from',
      icon: 'trip_origin',
      label: locationLabel(filters.fromAddress),
      remove: () => {
        filters.fromAddress = '';
        onLocationFilterChange();
      },
    });
  }
  if (filters.toAddress) {
    chips.push({
      key: 'to',
      icon: 'place',
      label: locationLabel(filters.toAddress),
      remove: () => {
        filters.toAddress = '';
        onLocationFilterChange();
      },
    });
  }
  for (const type of filters.truckType ?? []) {
    chips.push({
      key: `truck-${type}`,
      icon: 'local_shipping',
      label: type,
      remove: () => {
        filters.truckType = (filters.truckType ?? []).filter((x) => x !== type);
      },
    });
  }
  if (typeof filters.priceFrom === 'number' || typeof filters.priceTo === 'number') {
    chips.push({
      key: 'price',
      icon: 'payments',
      label: rangeLabel(filters.priceFrom, filters.priceTo),
      remove: () => {
        filters.priceFrom = null;
        filters.priceTo = null;
      },
    });
  }
  if (typeof filters.weightFrom === 'number' || typeof filters.weightTo === 'number') {
    chips.push({
      key: 'weight',
      icon: 'scale',
      label: rangeLabel(filters.weightFrom, filters.weightTo, ' t'),
      remove: () => {
        filters.weightFrom = null;
        filters.weightTo = null;
      },
    });
  }
  return chips;
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
// Birinchi ekrandagi kartalardan biri bosilganda — bir bosishda tanlab, e'lonlarga o'tamiz
function chooseDirection(value: Direction) {
  direction.value = value;
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
/* ─── Yo'nalish tanlash ekrani ─── */
.kt-choose {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: calc(100vh - 200px);
  max-width: 480px;
  margin: 0 auto;
}
.kt-choose__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
  border-radius: 24px;
  background: var(--kt-primary-soft);
  color: var(--kt-primary);
}
.kt-choose__options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 24px;
}
.kt-choose__card {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px;
  border: 1px solid var(--kt-border);
  border-radius: var(--kt-radius);
  background: var(--kt-surface);
  box-shadow: var(--kt-shadow);
  font: inherit;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}
.kt-choose__card:hover {
  border-color: var(--kt-primary);
  box-shadow: var(--kt-shadow-hover);
}
.kt-choose__card:active {
  transform: scale(0.99);
}
.kt-choose__card:focus-visible {
  outline: 3px solid rgba(36, 89, 224, 0.35);
  outline-offset: 2px;
}
.kt-choose__card-icon {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
}
.kt-choose__card-icon--intercity {
  background: var(--kt-primary-soft);
  color: var(--kt-primary);
}
.kt-choose__card-icon--international {
  background: var(--kt-teal-soft);
  color: #0b7a6b;
}

/* ─── Asboblar paneli: yo'nalish, qidiruv, filtr ─── */
.kt-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'direction direction'
    'search actions';
  gap: 10px;
  align-items: center;
}
@media (min-width: 1024px) {
  .kt-toolbar {
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas: 'direction search actions';
    gap: 12px;
  }
}
.kt-toolbar__direction {
  grid-area: direction;
}
.kt-toolbar__search {
  grid-area: search;
}
.kt-toolbar__search :deep(.q-field__control) {
  background: var(--kt-surface);
  height: 44px;
}
.kt-toolbar__search :deep(.q-field__marginal) {
  height: 44px;
}
.kt-toolbar__actions {
  grid-area: actions;
  display: flex;
  align-items: center;
  gap: 4px;
}


.kt-filter-btn {
  height: 44px;
  padding: 0 14px;
  border: 1px solid var(--kt-border);
  background: var(--kt-surface);
  color: var(--kt-text-2);
}
.kt-filter-btn--active {
  border-color: var(--kt-primary);
  background: var(--kt-primary-soft);
  color: var(--kt-primary);
}

.kt-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  margin: 14px 2px 10px;
  font-size: 13px;
}
.kt-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--kt-muted);
}
.kt-live__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #b5bdcb;
}
.kt-live--on {
  color: #15803d;
}
.kt-live--on .kt-live__dot {
  background: #16a34a;
  box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.5);
  animation: kt-pulse 2s infinite;
}
@keyframes kt-pulse {
  70% {
    box-shadow: 0 0 0 6px rgba(22, 163, 74, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(22, 163, 74, 0);
  }
}

.kt-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: -2px 0 14px;
}
.kt-chip {
  height: 30px;
  margin: 0;
  padding: 0 10px;
  border: 1px solid #cdd9fb;
  background: var(--kt-surface);
  color: var(--kt-primary-dark);
  font-size: 13px;
  font-weight: 600;
}

/* ─── Filtr paneli ─── */
.kt-filter__inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.kt-filter__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 8px;
}
.kt-filter__body {
  flex: 1 1 auto;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 16px 16px;
}
.kt-filter__foot {
  display: flex;
  gap: 8px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--kt-border);
  background: var(--kt-surface);
}
.kt-filter__foot :deep(.q-btn) {
  height: 44px;
}

.kt-new-ads {
  padding: 6px 16px;
  box-shadow: 0 8px 24px rgba(36, 89, 224, 0.35);
}

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
