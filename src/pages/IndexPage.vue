<template>
  <main>
    <!-- Filter drawer -->
    <q-drawer v-model="drawerOpen" overlay :width="320" class="p-3" side="right" bordered>
      <div class="flex justify-between items-center mb-3">
        <span class="font-bold text-lg">Filtr</span>
        <q-btn flat dense icon="close" @click="drawerOpen = false" />
      </div>
      <div class="flex flex-col gap-3">
        <!-- Mamlakat (faqat shaharlararo) -->
        <q-select
          v-if="direction === 'intercity'"
          filled
          v-model="countryId"
          use-input
          clearable
          input-debounce="400"
          label="Mamlakat"
          :options="countryOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          @filter="filterCountry"
          @update:model-value="onCountryChange"
          behavior="menu"
        >
          <template #option="{ itemProps, opt }">
            <q-item v-bind="itemProps">
              <q-item-section>{{ opt.label }}</q-item-section>
            </q-item>
          </template>
          <template #no-option>
            <q-item><q-item-section class="text-grey">Qidirish uchun matn kiriting</q-item-section></q-item>
          </template>
        </q-select>

        <q-select
          filled
          v-model="filters.fromAddress"
          use-input
          clearable
          input-debounce="400"
          label="Qayerdan"
          :options="fromOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          @filter="filterFrom"
          behavior="menu"
        >
          <template #option="{ itemProps, opt }">
            <q-item v-bind="itemProps">
              <q-item-section>{{ opt.label }}</q-item-section>
            </q-item>
          </template>
          <template #no-option>
            <q-item><q-item-section class="text-grey">Qidirish uchun matn kiriting</q-item-section></q-item>
          </template>
        </q-select>

        <q-select
          filled
          v-model="filters.toAddress"
          use-input
          clearable
          input-debounce="400"
          label="Qayerga"
          :options="toOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          @filter="filterTo"
          behavior="menu"
        >
          <template #option="{ itemProps, opt }">
            <q-item v-bind="itemProps">
              <q-item-section>{{ opt.label }}</q-item-section>
            </q-item>
          </template>
          <template #no-option>
            <q-item><q-item-section class="text-grey">Qidirish uchun matn kiriting</q-item-section></q-item>
          </template>
        </q-select>

        <q-select
          filled
          v-model="filters.truckType"
          clearable
          multiple
          use-chips
          label="Mashina turi"
          :options="TRUCK_TYPES"
          behavior="menu"
        />
        <div class="grid grid-cols-2 gap-2">
          <q-input v-model.number="filters.priceFrom" label="Min narx" type="number" />
          <q-input v-model.number="filters.priceTo" label="Max narx" type="number" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <q-input v-model.number="filters.weightFrom" label="Min vazn (t)" type="number" />
          <q-input v-model.number="filters.weightTo" label="Max vazn (t)" type="number" />
        </div>
        <q-btn color="primary" label="Qo'llash" @click="drawerOpen = false" />
        <q-btn flat label="Tozalash" @click="resetFilters" />
      </div>
    </q-drawer>

    <q-page class="p-3">
      <!-- Direction selection screen -->
      <div v-if="!directionChosen" class="flex flex-col h-[85vh] justify-center items-center gap-4">
        <div class="text-xl font-bold text-center">Yuk qidirish uchun yo'nalish tanlang</div>
        <div class="flex gap-4">
          <q-radio v-model="direction" val="international" label="Xalqaro" />
          <q-radio v-model="direction" val="intercity" label="Shaharlararo" />
        </div>
        <q-btn
          :disabled="!direction"
          color="primary"
          label="Davom etish"
          class="min-w-[150px]"
          @click="confirmDirection"
        />
      </div>

      <!-- Ads view -->
      <template v-else>
        <div class="flex gap-2 mb-4 items-center flex-wrap">
          <div class="flex gap-4">
            <q-radio v-model="direction" val="international" label="Xalqaro" @update:model-value="onDirectionChange" />
            <q-radio v-model="direction" val="intercity" label="Shaharlararo" @update:model-value="onDirectionChange" />
          </div>
          <q-space />
          <q-btn flat dense icon="filter_list" @click="drawerOpen = true">
            <q-badge v-if="activeFilterCount > 0" color="negative" floating>{{ activeFilterCount }}</q-badge>
          </q-btn>
        </div>

        <div v-if="!allAds.length && !loading" class="text-center text-grey-6 py-10">
          Hozircha e'lonlar yo'q
        </div>

        <ads-card :ads="filteredAds" />

        <div v-if="filteredAds.length === 0 && allAds.length > 0" class="text-center text-grey-6 py-10">
          Filtrga mos e'lon topilmadi
        </div>
      </template>
    </q-page>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import AdsCard from 'components/AdsCard.vue';
import { apiGetAds, apiGetCountries } from 'src/api';
import { useLocationSearch } from 'src/composables/useLocationSearch';
import type { Advertisement, Country } from 'src/types';

const TRUCK_TYPES = ['Tent', 'Ref', 'Plashchaniy', 'Konteyner', 'Bortovoy', 'Samosvал'];

// ─── Direction ────────────────────────────────────────────────────────────────
const direction = ref<'international' | 'intercity'>(
  (localStorage.getItem('direction') as 'international' | 'intercity') || 'intercity',
);
const directionChosen = ref(!!localStorage.getItem('direction'));

// ─── Country selector ─────────────────────────────────────────────────────────
interface CountryOption { label: string; value: number }

const countryId = ref<number | null>(null);
const countryOptions = ref<CountryOption[]>([]);

function toCountryOption(c: Country): CountryOption {
  const label = c.translations?.['uz'] ?? c.translations?.['ru'] ?? c.name;
  return { label, value: c.id };
}

async function loadDefaultCountry() {
  const res = await apiGetCountries({ q: 'uzbek' });
  const countries = res.data.data;
  countryOptions.value = countries.map(toCountryOption);
  if (countries.length && countryId.value === null) {
    const uz = countries.find((c) => c.iso2 === 'UZ') ?? countries[0];
    if (uz) countryId.value = uz.id;
  }
}

function filterCountry(val: string, update: (fn: () => void) => void) {
  void apiGetCountries({ q: val || 'a' }).then((res) => {
    update(() => { countryOptions.value = res.data.data.map(toCountryOption); });
  });
}

function onCountryChange() {
  filters.fromAddress = '';
  filters.toAddress = '';
  void loadInitial();
}

// ─── Location search ──────────────────────────────────────────────────────────
const { fromOptions, toOptions, loadInitial, filterFrom, filterTo } = useLocationSearch(
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
