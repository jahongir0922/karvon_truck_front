<template>
  <main>
    <!-- Filter drawer -->
    <q-drawer v-model="drawerOpen" overlay :width="320" class="p-3" side="right" bordered>
      <div class="flex justify-between items-center mb-3">
        <span class="font-bold text-lg">{{ t('index.filterTitle') }}</span>
        <q-btn flat dense icon="close" @click="drawerOpen = false" />
      </div>
      <div class="flex flex-col gap-3">
        <!-- Yo'nalish -->
        <div class="flex gap-4">
          <q-radio v-model="direction" val="international" :label="t('ad.international')" @update:model-value="onDirectionChange" />
          <q-radio v-model="direction" val="intercity" :label="t('ad.intercity')" @update:model-value="onDirectionChange" />
        </div>

        <!-- Mamlakat (faqat shaharlararo) -->
        <q-select
          v-if="direction === 'intercity'"
          filled
          v-model="countryId"
          use-input
          clearable
          input-debounce="400"
          :label="t('ad.country')"
          :options="countryOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          @filter="filterCountry"
          @update:model-value="onCountryChange"
          @virtual-scroll="(e) => onCountryScroll(e.to)"
          behavior="menu"
        >
          <template #option="{ itemProps, opt }">
            <q-item v-bind="itemProps">
              <q-item-section>{{ opt.label }}</q-item-section>
            </q-item>
          </template>
          <template #no-option>
            <q-item><q-item-section class="text-grey">{{ t('common.noOption') }}</q-item-section></q-item>
          </template>
        </q-select>

        <q-select
          filled
          v-model="filters.fromAddress"
          use-input
          clearable
          input-debounce="400"
          :label="t('ad.from')"
          :options="fromOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          @filter="filterFrom"
          @virtual-scroll="(e) => onFromScroll(e.to)"
          behavior="menu"
        >
          <template #option="{ itemProps, opt }">
            <q-item v-bind="itemProps">
              <q-item-section>{{ locationLabel(opt.label) }}</q-item-section>
            </q-item>
          </template>
          <template #no-option>
            <q-item><q-item-section class="text-grey">{{ t('common.noOption') }}</q-item-section></q-item>
          </template>
        </q-select>

        <q-select
          filled
          v-model="filters.toAddress"
          use-input
          clearable
          input-debounce="400"
          :label="t('ad.to')"
          :options="toOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          @filter="filterTo"
          @virtual-scroll="(e) => onToScroll(e.to)"
          behavior="menu"
        >
          <template #option="{ itemProps, opt }">
            <q-item v-bind="itemProps">
              <q-item-section>{{ locationLabel(opt.label) }}</q-item-section>
            </q-item>
          </template>
          <template #no-option>
            <q-item><q-item-section class="text-grey">{{ t('common.noOption') }}</q-item-section></q-item>
          </template>
        </q-select>

        <q-select
          filled
          v-model="filters.truckType"
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
          :disabled="!direction"
          color="primary"
          :label="t('index.continue')"
          class="min-w-[150px]"
          @click="confirmDirection"
        />
      </div>

      <!-- Ads view -->
      <template v-else>
        <div class="flex gap-2 mb-4 items-center flex-wrap">
          <div class="flex gap-4">
            <q-radio v-model="direction" val="international" :label="t('ad.international')" @update:model-value="onDirectionChange" />
            <q-radio v-model="direction" val="intercity" :label="t('ad.intercity')" @update:model-value="onDirectionChange" />
          </div>
          <q-space />
          <q-btn flat dense icon="filter_list" @click="drawerOpen = true">
            <q-badge v-if="activeFilterCount > 0" color="negative" floating>{{ activeFilterCount }}</q-badge>
          </q-btn>
        </div>

        <div v-if="!allAds.length && !loading" class="text-center text-grey-6 py-10">
          {{ t('index.noAds') }}
        </div>

        <ads-card :ads="filteredAds" />

        <div v-if="filteredAds.length === 0 && allAds.length > 0" class="text-center text-grey-6 py-10">
          {{ t('index.noFilteredAds') }}
        </div>
      </template>
    </q-page>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import AdsCard from 'components/AdsCard.vue';
import { apiGetAds, apiGetCountries } from 'src/api';
import { useLocationSearch } from 'src/composables/useLocationSearch';
import { countryLabel } from 'src/composables/useAdminCountrySelect';
import type { Advertisement, Country } from 'src/types';

const { t, locale } = useI18n();

const TRUCK_TYPES = ['Tent', 'Ref', 'Plashchaniy', 'Konteyner', 'Bortovoy', 'Samosvал'];

function locationLabel(label: string) {
  if (direction.value === 'intercity') {
    const idx = label.indexOf(', ');
    return idx !== -1 ? label.slice(idx + 2) : label;
  }
  return label;
}

// ─── Direction ────────────────────────────────────────────────────────────────
const direction = ref<'international' | 'intercity'>(
  (localStorage.getItem('direction') as 'international' | 'intercity') || 'intercity',
);
const directionChosen = ref(!!localStorage.getItem('direction'));

// ─── Country selector ─────────────────────────────────────────────────────────
interface CountryOption { label: string; value: number }

const COUNTRY_LIMIT = 30;
const countryId = ref<number | null>(null);
const countryOptions = ref<CountryOption[]>([]);
const countryHasMore = ref(false);
let currentCountryQuery = 'a';

function toCountryOption(c: Country): CountryOption {
  return { label: countryLabel(c, locale.value), value: c.id };
}

async function loadDefaultCountry() {
  const res = await apiGetCountries({ q: 'uzbek', limit: COUNTRY_LIMIT });
  const countries = res.data.data;
  countryOptions.value = countries.map(toCountryOption);
  countryHasMore.value = countries.length === COUNTRY_LIMIT;
  if (countries.length && countryId.value === null) {
    const uz = countries.find((c) => c.iso2 === 'UZ') ?? countries[0];
    if (uz) countryId.value = uz.id;
  }
}

function filterCountry(val: string, update: (fn: () => void) => void) {
  currentCountryQuery = val || 'a';
  void apiGetCountries({ q: currentCountryQuery, limit: COUNTRY_LIMIT }).then((res) => {
    update(() => {
      countryOptions.value = res.data.data.map(toCountryOption);
      countryHasMore.value = res.data.data.length === COUNTRY_LIMIT;
    });
  });
}

async function loadMoreCountry() {
  if (!countryHasMore.value) return;
  const res = await apiGetCountries({ q: currentCountryQuery, limit: COUNTRY_LIMIT, offset: countryOptions.value.length });
  const more = res.data.data.map(toCountryOption);
  countryOptions.value = [...countryOptions.value, ...more];
  countryHasMore.value = more.length === COUNTRY_LIMIT;
}

function onCountryScroll(to: number) {
  if (to >= countryOptions.value.length - 3 && countryHasMore.value) void loadMoreCountry();
}

function onFromScroll(to: number) {
  if (to >= fromOptions.value.length - 3 && fromHasMore.value) void loadMoreFrom();
}
function onToScroll(to: number) {
  if (to >= toOptions.value.length - 3 && toHasMore.value) void loadMoreTo();
}

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
} = useLocationSearch(
  () => direction.value,
  () => (direction.value === 'intercity' && countryId.value ? countryId.value : undefined),
);

// ─── Ads ──────────────────────────────────────────────────────────────────────
const drawerOpen = ref(false);
const loading = ref(false);
const allAds = ref<Advertisement[]>([]);

const filters = reactive({
  fromAddress: '',
  toAddress: '',
  truckType: [] as string[],
  priceFrom: null as number | null,
  priceTo: null as number | null,
  weightFrom: null as number | null,
  weightTo: null as number | null,
});

// ─── Computed ─────────────────────────────────────────────────────────────────
const activeFilterCount = computed(() => {
  let n = 0;
  if (filters.fromAddress) n++;
  if (filters.toAddress) n++;
  if (filters.truckType.length) n++;
  if (filters.priceFrom !== null) n++;
  if (filters.priceTo !== null) n++;
  if (filters.weightFrom !== null) n++;
  if (filters.weightTo !== null) n++;
  return n;
});

const filteredAds = computed(() =>
  allAds.value.filter((ad) => {
    if (ad.direction !== direction.value) return false;
    if (filters.fromAddress && !ad.fromAddress.toLowerCase().includes(filters.fromAddress.toLowerCase())) return false;
    if (filters.toAddress && !ad.toAddress.toLowerCase().includes(filters.toAddress.toLowerCase())) return false;
    if (filters.truckType.length && !filters.truckType.some((t) => ad.truckType?.includes(t))) return false;
    const cost = Number(ad.deliveryCost);
    if (filters.priceFrom !== null && cost < filters.priceFrom) return false;
    if (filters.priceTo !== null && cost > filters.priceTo) return false;
    const w = Number(ad.weight);
    if (filters.weightFrom !== null && w < filters.weightFrom) return false;
    if (filters.weightTo !== null && w > filters.weightTo) return false;
    return true;
  }),
);

// ─── Methods ──────────────────────────────────────────────────────────────────
function confirmDirection() {
  localStorage.setItem('direction', direction.value);
  directionChosen.value = true;
  void loadAds();
  if (direction.value === 'intercity') {
    void loadDefaultCountry().then(() => loadInitial());
  } else {
    void loadInitial();
  }
}

function onDirectionChange() {
  localStorage.setItem('direction', direction.value);
  countryId.value = null;
  resetFilters();
  void loadAds();
  if (direction.value === 'intercity') {
    void loadDefaultCountry().then(() => loadInitial());
  } else {
    void loadInitial();
  }
}

async function loadAds() {
  loading.value = true;
  try {
    const res = await apiGetAds({ page: 1, perPage: 100 });
    allAds.value = res.data.data;
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  filters.fromAddress = '';
  filters.toAddress = '';
  filters.truckType = [];
  filters.priceFrom = null;
  filters.priceTo = null;
  filters.weightFrom = null;
  filters.weightTo = null;
}

// ─── WebSocket ────────────────────────────────────────────────────────────────
function setupWebSocket() {
  const wsUrl = (process.env.WS_URL || 'ws://localhost:5000/ws/') + 'ads';
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data as string) as { type: string; data: Advertisement | Advertisement[] };
    if (msg.type === 'initial_ads') {
      const incoming = msg.data as Advertisement[];
      const newAds = incoming.filter((a) => !allAds.value.find((x) => x._id === a._id));
      allAds.value = [...newAds, ...allAds.value];
    } else if (msg.type === 'ad_change') {
      const ad = msg.data as Advertisement;
      const idx = allAds.value.findIndex((x) => x._id === ad._id);
      if (idx >= 0) allAds.value.splice(idx, 1, ad);
      else allAds.value.unshift(ad);
    }
  };

  ws.onclose = () => { setTimeout(setupWebSocket, 5000); };
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(() => {
  if (directionChosen.value) {
    void loadAds();
    if (direction.value === 'intercity') {
      void loadDefaultCountry().then(() => loadInitial());
    } else {
      void loadInitial();
    }
  }
  setupWebSocket();
});
</script>
