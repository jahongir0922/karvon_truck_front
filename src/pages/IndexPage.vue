<template>
  <main>
    <!-- Filter drawer -->
    <q-drawer v-model="drawerOpen" overlay :width="320" class="p-3" side="right" bordered>
      <div class="flex justify-between items-center mb-3">
        <span class="font-bold text-lg">Filtr</span>
        <q-btn flat dense icon="close" @click="drawerOpen = false" />
      </div>
      <div class="flex flex-col gap-3">
        <q-select
          filled
          v-model="filters.fromAddress"
          use-input
          clearable
          input-debounce="400"
          label="Qayerdan"
          :options="fromOptions"
          @filter="(v, u) => filterLocations(v, u, 'from')"
          behavior="menu"
        >
          <template #no-option><q-item><q-item-section class="text-grey">Topilmadi</q-item-section></q-item></template>
        </q-select>
        <q-select
          filled
          v-model="filters.toAddress"
          use-input
          clearable
          input-debounce="400"
          label="Qayerga"
          :options="toOptions"
          @filter="(v, u) => filterLocations(v, u, 'to')"
          behavior="menu"
        >
          <template #no-option><q-item><q-item-section class="text-grey">Topilmadi</q-item-section></q-item></template>
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
        <div class="flex gap-2 mb-4 items-center">
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
import { apiGetAds, apiGetCountries, apiGetCities } from 'src/api';
import type { Advertisement } from 'src/types';

const TRUCK_TYPES = ['Tent', 'Ref', 'Plashchaniy', 'Konteyner', 'Bortovoy', 'Samosvал'];

// ─── State ────────────────────────────────────────────────────────────────────
const direction = ref('');
const directionChosen = ref(!!localStorage.getItem('direction'));
if (directionChosen.value) direction.value = localStorage.getItem('direction') ?? '';

const drawerOpen = ref(false);
const loading = ref(false);
const allAds = ref<Advertisement[]>([]);

const fromOptions = ref<string[]>([]);
const toOptions = ref<string[]>([]);

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
  let count = 0;
  if (filters.fromAddress) count++;
  if (filters.toAddress) count++;
  if (filters.truckType.length) count++;
  if (filters.priceFrom !== null) count++;
  if (filters.priceTo !== null) count++;
  if (filters.weightFrom !== null) count++;
  if (filters.weightTo !== null) count++;
  return count;
});

const filteredAds = computed(() => {
  return allAds.value.filter((ad) => {
    if (ad.direction !== direction.value) return false;

    if (filters.fromAddress && !ad.fromAddress.toLowerCase().includes(filters.fromAddress.toLowerCase())) return false;
    if (filters.toAddress && !ad.toAddress.toLowerCase().includes(filters.toAddress.toLowerCase())) return false;

    if (filters.truckType.length) {
      const hasType = filters.truckType.some((t) => ad.truckType?.includes(t));
      if (!hasType) return false;
    }

    const cost = Number(ad.deliveryCost);
    if (filters.priceFrom !== null && cost < filters.priceFrom) return false;
    if (filters.priceTo !== null && cost > filters.priceTo) return false;

    const w = Number(ad.weight);
    if (filters.weightFrom !== null && w < filters.weightFrom) return false;
    if (filters.weightTo !== null && w > filters.weightTo) return false;

    return true;
  });
});

// ─── Methods ──────────────────────────────────────────────────────────────────
function confirmDirection() {
  localStorage.setItem('direction', direction.value);
  directionChosen.value = true;
  void loadAds();
}

function onDirectionChange() {
  localStorage.setItem('direction', direction.value);
  resetFilters();
  void loadAds();
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

async function filterLocations(val: string, update: (fn: () => void) => void, side: 'from' | 'to') {
  if (!val || val.length < 2) {
    update(() => {
      if (side === 'from') fromOptions.value = [];
      else toOptions.value = [];
    });
    return;
  }
  try {
    let names: string[] = [];
    if (direction.value === 'international') {
      const res = await apiGetCountries();
      names = res.data.data
        .filter((c) => c.name.toLowerCase().includes(val.toLowerCase()))
        .map((c) => c.name);
    } else {
      const res = await apiGetCities({ name: val });
      names = res.data.data.map((c) => c.name);
    }
    update(() => {
      if (side === 'from') fromOptions.value = names;
      else toOptions.value = names;
    });
  } catch {
    update(() => {});
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
    const msg = JSON.parse(event.data as string);
    if (msg.type === 'initial_ads') {
      const newAds = (msg.data as Advertisement[]).filter((a) => !allAds.value.find((x) => x._id === a._id));
      allAds.value = [...newAds, ...allAds.value];
    } else if (msg.type === 'ad_change') {
      const ad = msg.data as Advertisement;
      const idx = allAds.value.findIndex((x) => x._id === ad._id);
      if (idx >= 0) allAds.value.splice(idx, 1, ad);
      else allAds.value.unshift(ad);
    }
  };

  ws.onclose = () => {
    setTimeout(setupWebSocket, 5000);
  };
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(() => {
  if (directionChosen.value) void loadAds();
  setupWebSocket();
});
</script>
