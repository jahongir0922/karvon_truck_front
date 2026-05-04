<template>
  <q-form ref="formRef" class="flex flex-col p-3 gap-3 max-w-[800px] mx-auto" @submit.prevent="submitAd">
    <div class="text-lg font-bold">Yangi yuk e'loni</div>

    <!-- Yo'nalish -->
    <div class="flex gap-4">
      <q-radio v-model="form.direction" val="international" label="Xalqaro" @update:model-value="onDirectionChange" />
      <q-radio v-model="form.direction" val="intercity" label="Shaharlararo" @update:model-value="onDirectionChange" />
    </div>

    <!-- Mamlakat (faqat shaharlararo) -->
    <q-select
      v-if="form.direction === 'intercity'"
      filled
      v-model="form.countryId"
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
      @virtual-scroll="(e) => onCountryScroll(e.to)"
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

    <section class="grid sm:grid-cols-2 gap-3">
      <!-- Qayerdan -->
      <q-select
        filled
        v-model="form.fromAddress"
        use-input
        clearable
        input-debounce="400"
        label="Qayerdan *"
        :options="fromOptions"
        option-label="label"
        option-value="value"
        emit-value
        map-options
        @filter="filterFrom"
        @virtual-scroll="(e) => onFromScroll(e.to)"
        behavior="menu"
        :rules="[
          (v) => !!v || 'Majburiy maydon',
          (v) => !v || v.length >= 2 || 'Kamida 2 ta belgi',
        ]"
        lazy-rules
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

      <!-- Qayerga -->
      <q-select
        filled
        v-model="form.toAddress"
        use-input
        clearable
        input-debounce="400"
        label="Qayerga *"
        :options="toOptions"
        option-label="label"
        option-value="value"
        emit-value
        map-options
        @filter="filterTo"
        @virtual-scroll="(e) => onToScroll(e.to)"
        behavior="menu"
        :rules="[
          (v) => !!v || 'Majburiy maydon',
          (v) => !v || v.length >= 2 || 'Kamida 2 ta belgi',
        ]"
        lazy-rules
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

      <!-- Mashina turi -->
      <q-select
        filled
        v-model="form.truckType"
        clearable
        multiple
        use-chips
        label="Mashina turi"
        :options="TRUCK_TYPES"
        behavior="menu"
      >
        <template #option="{ itemProps, opt, selected, toggleOption }">
          <q-item v-bind="itemProps">
            <q-item-section>{{ opt }}</q-item-section>
            <q-item-section side>
              <q-toggle :model-value="selected" @update:model-value="toggleOption(opt)" />
            </q-item-section>
          </q-item>
        </template>
      </q-select>

      <!-- Yuk nomi -->
      <q-input
        filled
        v-model="form.loadName"
        label="Yuk nomi"
        :rules="[
          (v) => !v || v.length >= 2 || 'Kamida 2 ta belgi',
          (v) => !v || v.length <= 50 || 'Ko\'pi bilan 50 ta belgi',
        ]"
        lazy-rules
      />

      <!-- Yuk tavsifi -->
      <q-input
        filled
        v-model="form.descriptions"
        label="Yuk tavsifi"
        type="textarea"
        rows="2"
        class="sm:col-span-2"
        :rules="[(v) => !v || v.length <= 500 || 'Ko\'pi bilan 500 ta belgi']"
        lazy-rules
      />

      <!-- To'lov turi -->
      <q-select
        filled
        v-model="form.paymentType"
        label="To'lov turi"
        clearable
        :options="PAYMENT_TYPES"
        behavior="menu"
      />

      <!-- Avans + Narx + Valyuta -->
      <div class="flex gap-2 items-start">
        <q-input
          class="flex-1"
          filled
          v-model="form.advance"
          label="Avans"
          :rules="[
            (v) => !v || /^\d{1,16}(\.\d{1,4})?$/.test(v) || 'Faqat raqam (masalan: 500 yoki 500.50)',
          ]"
          lazy-rules
        />
        <q-input
          class="flex-1"
          filled
          v-model="form.deliveryCost"
          label="Narxi"
          :rules="[
            (v) => !v || /^\d{1,16}(\.\d{1,4})?$/.test(v) || 'Faqat raqam (masalan: 1000 yoki 1000.50)',
          ]"
          lazy-rules
        />
        <q-select
          filled
          v-model="form.currency"
          :options="CURRENCIES"
          behavior="menu"
          style="min-width: 80px"
        />
      </div>

      <!-- Hajm va vazn -->
      <q-input
        filled
        v-model.number="form.volume"
        label="Yuk hajmi (m³)"
        type="number"
        :rules="[
          (v) => v === null || v === '' || v >= 2 || 'Kamida 2 m³',
          (v) => v === null || v === '' || v <= 10000 || 'Ko\'pi bilan 10 000 m³',
        ]"
        lazy-rules
      />
      <q-input
        filled
        v-model.number="form.weight"
        label="Yuk vazni (tonna)"
        type="number"
        :rules="[
          (v) => v === null || v === '' || v >= 2 || 'Kamida 2 tonna',
          (v) => v === null || v === '' || v <= 50 || 'Ko\'pi bilan 50 tonna',
        ]"
        lazy-rules
      />

      <!-- Yuklash vaqti -->
      <q-input filled v-model="form.loadingTime" label="Yuklash vaqti" type="date" />

      <!-- Telefon -->
      <q-input
        filled
        v-model="form.phone"
        label="Telefon *"
        :rules="[
          (v) => !!v || 'Majburiy maydon',
          (v) => !v || v.length >= 5 || 'Kamida 5 ta belgi',
          (v) => !v || v.length <= 20 || 'Ko\'pi bilan 20 ta belgi',
        ]"
        lazy-rules
      />

      <!-- Mijoz ismi -->
      <q-input
        filled
        v-model="form.clientName"
        label="Murojaat uchun (ism)"
        :rules="[
          (v) => !v || v.length >= 2 || 'Kamida 2 ta belgi',
          (v) => !v || v.length <= 50 || 'Ko\'pi bilan 50 ta belgi',
        ]"
        lazy-rules
      />
    </section>

    <div v-if="errorMsg" class="text-negative text-sm">{{ errorMsg }}</div>

    <div class="flex justify-end gap-2">
      <q-btn flat label="Tozalash" @click="resetForm" />
      <q-btn color="primary" label="E'lon qo'shish" :loading="loading" type="submit" />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useQuasar, QForm } from 'quasar';
import { apiCreateAd, apiGetCountries } from 'src/api';
import { useLocationSearch } from 'src/composables/useLocationSearch';
import type { Country } from 'src/types';

const $q = useQuasar();

const TRUCK_TYPES = ['Tent', 'Ref', 'Plashchaniy', 'Konteyner', 'Bortovoy', 'Samosvал'];
const PAYMENT_TYPES = ['Naqd', "Pul o'tkazish"];
const CURRENCIES = ['UZS', 'USD', 'RUB'];

const formRef = ref<QForm | null>(null);
const loading = ref(false);
const errorMsg = ref('');

interface CountryOption {
  label: string;
  value: number;
}

interface AdForm {
  direction: 'international' | 'intercity';
  countryId: number | null;
  fromAddress: string;
  toAddress: string;
  truckType: string[];
  loadName: string;
  descriptions: string;
  paymentType: string;
  advance: string;
  deliveryCost: string;
  currency: string;
  volume: number | null;
  weight: number | null;
  loadingTime: string;
  phone: string;
  clientName: string;
}

const form = reactive<AdForm>({
  direction: 'intercity',
  countryId: null,
  fromAddress: '',
  toAddress: '',
  truckType: [],
  loadName: '',
  descriptions: '',
  paymentType: '',
  advance: '',
  deliveryCost: '',
  currency: 'UZS',
  volume: null,
  weight: null,
  loadingTime: '',
  phone: '',
  clientName: '',
});

// ─── Country selector ──────────────────────────────────────────────────────────
const COUNTRY_LIMIT = 30;
const countryOptions = ref<CountryOption[]>([]);
const countryHasMore = ref(false);
let currentCountryQuery = 'a';

function toCountryOption(c: Country): CountryOption {
  const label = c.translations?.['uz'] ?? c.translations?.['ru'] ?? c.name;
  return { label, value: c.id };
}

async function loadDefaultCountry() {
  const res = await apiGetCountries({ q: 'uzbek', limit: COUNTRY_LIMIT });
  const countries = res.data.data;
  countryOptions.value = countries.map(toCountryOption);
  countryHasMore.value = countries.length === COUNTRY_LIMIT;
  if (countries.length && form.countryId === null) {
    const uz = countries.find((c) => c.iso2 === 'UZ') ?? countries[0];
    if (uz) form.countryId = uz.id;
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

// ─── Location search ───────────────────────────────────────────────────────────
const {
  fromOptions, toOptions,
  fromHasMore, toHasMore,
  loadInitial, filterFrom, filterTo,
  loadMoreFrom, loadMoreTo,
  clearOptions,
} = useLocationSearch(
  () => form.direction,
  () => (form.direction === 'intercity' && form.countryId ? form.countryId : undefined),
);

function onFromScroll(to: number) {
  if (to >= fromOptions.value.length - 3 && fromHasMore.value) void loadMoreFrom();
}
function onToScroll(to: number) {
  if (to >= toOptions.value.length - 3 && toHasMore.value) void loadMoreTo();
}

function onCountryChange() {
  form.fromAddress = '';
  form.toAddress = '';
  void loadInitial();
}

function onDirectionChange() {
  form.fromAddress = '';
  form.toAddress = '';
  form.countryId = null;
  if (form.direction === 'intercity') {
    void loadDefaultCountry().then(() => loadInitial());
  } else {
    void loadInitial();
  }
}

onMounted(() => {
  if (form.direction === 'intercity') {
    void loadDefaultCountry().then(() => loadInitial());
  } else {
    void loadInitial();
  }
});

async function submitAd() {
  errorMsg.value = '';
  const valid = await formRef.value?.validate();
  if (!valid) return;

  loading.value = true;
  try {
    await apiCreateAd({
      direction: form.direction,
      fromAddress: form.fromAddress,
      toAddress: form.toAddress,
      truckType: form.truckType,
      ...(form.loadName && { loadName: form.loadName }),
      ...(form.descriptions && { descriptions: form.descriptions }),
      ...(form.paymentType && { paymentType: form.paymentType }),
      ...(form.advance && { advance: form.advance }),
      ...(form.deliveryCost && { deliveryCost: form.deliveryCost }),
      ...(form.currency && { currency: form.currency }),
      ...(form.volume !== null && { volume: form.volume }),
      ...(form.weight !== null && { weight: form.weight }),
      ...(form.loadingTime && { loadingTime: form.loadingTime }),
      phone: form.phone,
      ...(form.clientName && { clientName: form.clientName }),
    });
    $q.notify({ type: 'positive', message: "E'lon muvaffaqiyatli qo'shildi!" });
    resetForm();
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
    if (Array.isArray(msg)) {
      errorMsg.value = msg.join(', ');
    } else if (typeof msg === 'string') {
      errorMsg.value = msg;
    } else {
      errorMsg.value = "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.";
    }
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.direction = 'intercity';
  form.countryId = null;
  form.fromAddress = '';
  form.toAddress = '';
  form.truckType = [];
  form.loadName = '';
  form.descriptions = '';
  form.paymentType = '';
  form.advance = '';
  form.deliveryCost = '';
  form.currency = 'UZS';
  form.volume = null;
  form.weight = null;
  form.loadingTime = '';
  form.phone = '';
  form.clientName = '';
  clearOptions();
}
</script>
