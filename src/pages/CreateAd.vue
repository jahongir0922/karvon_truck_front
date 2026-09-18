<template>
  <q-form ref="formRef" class="flex flex-col p-3 gap-3 max-w-[800px] mx-auto" @submit.prevent="submitAd">
    <div class="text-lg font-bold">{{ t('ad.newAd') }}</div>

    <q-banner v-if="!auth.isLoggedIn" dense rounded class="bg-blue-1 text-grey-9">
      <template #avatar><q-icon name="info" color="primary" /></template>
      {{ t('ad.loginHint') }}
      <template #action>
        <q-btn flat color="primary" :label="t('nav.login')" :to="{ path: '/login', query: { redirect: '/create-ads' } }" />
      </template>
    </q-banner>

    <!-- Yo'nalish -->
    <div class="flex gap-4">
      <q-radio
        v-model="form.direction"
        val="international"
        :label="t('ad.international')"
        @update:model-value="onDirectionChange"
      />
      <q-radio
        v-model="form.direction"
        val="intercity"
        :label="t('ad.intercity')"
        @update:model-value="onDirectionChange"
      />
    </div>

    <!-- Mamlakat (faqat shaharlararo) -->
    <q-select
      v-if="form.direction === 'intercity'"
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

    <section class="grid sm:grid-cols-2 gap-3">
      <!-- Qayerdan -->
      <q-select
        v-model="form.fromAddress"
        filled
        use-input
        clearable
        input-debounce="400"
        :label="t('ad.fromRequired')"
        :options="fromOptions"
        option-label="label"
        option-value="value"
        emit-value
        map-options
        behavior="menu"
        :rules="[
          (v) => !!v || t('common.required'),
          (v) => !v || v.length >= 2 || t('common.minChars', { n: 2 }),
        ]"
        lazy-rules
        @filter="filterFrom"
        @virtual-scroll="onFromScroll"
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

      <!-- Qayerga -->
      <q-select
        v-model="form.toAddress"
        filled
        use-input
        clearable
        input-debounce="400"
        :label="t('ad.toRequired')"
        :options="toOptions"
        option-label="label"
        option-value="value"
        emit-value
        map-options
        behavior="menu"
        :rules="[
          (v) => !!v || t('common.required'),
          (v) => !v || v.length >= 2 || t('common.minChars', { n: 2 }),
        ]"
        lazy-rules
        @filter="filterTo"
        @virtual-scroll="onToScroll"
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

      <!-- Mashina turi -->
      <q-select
        v-model="form.truckType"
        filled
        clearable
        multiple
        use-chips
        :label="t('ad.truckType')"
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
        v-model="form.loadName"
        filled
        :label="t('ad.cargoName')"
        :rules="[
          (v) => !v || v.length >= 2 || t('common.minChars', { n: 2 }),
          (v) => !v || v.length <= 50 || t('common.maxChars', { n: 50 }),
        ]"
        lazy-rules
      />

      <!-- Yuk tavsifi -->
      <q-input
        v-model="form.descriptions"
        filled
        :label="t('ad.cargoDesc')"
        type="textarea"
        rows="2"
        class="sm:col-span-2"
        counter
        maxlength="500"
        :rules="[(v) => !v || v.length <= 500 || t('common.maxChars', { n: 500 })]"
        lazy-rules
      />

      <!-- To'lov turi -->
      <q-select
        v-model="form.paymentType"
        filled
        :label="t('ad.paymentType')"
        clearable
        :options="PAYMENT_TYPES"
        behavior="menu"
      />

      <!-- Avans + Narx + Valyuta -->
      <div class="flex gap-2 items-start">
        <q-input
          v-model="form.advance"
          class="flex-1"
          filled
          inputmode="decimal"
          :label="t('ad.advance')"
          :rules="[(v) => !v || MONEY_RE.test(v) || t('common.onlyNumber')]"
          lazy-rules
        />
        <q-input
          v-model="form.deliveryCost"
          class="flex-1"
          filled
          inputmode="decimal"
          :label="t('ad.price')"
          :rules="[(v) => !v || MONEY_RE.test(v) || t('common.onlyNumber')]"
          lazy-rules
        />
        <q-select
          v-model="form.currency"
          filled
          :options="CURRENCIES"
          behavior="menu"
          style="min-width: 80px"
        />
      </div>

      <!-- Hajm va vazn -->
      <q-input
        v-model.number="form.volume"
        filled
        :label="t('ad.volume')"
        type="number"
        :rules="[
          (v) => v === null || v === '' || v >= 2 || t('ad.minVolume'),
          (v) => v === null || v === '' || v <= 10000 || t('ad.maxVolume'),
        ]"
        lazy-rules
      />
      <q-input
        v-model.number="form.weight"
        filled
        :label="t('ad.weight')"
        type="number"
        :rules="[
          (v) => v === null || v === '' || v >= 2 || t('ad.minWeight'),
          (v) => v === null || v === '' || v <= 50 || t('ad.maxWeight'),
        ]"
        lazy-rules
      />

      <!-- Yuklash vaqti -->
      <q-input v-model="form.loadingTime" filled :label="t('ad.loadingTime')" type="date" />

      <!-- Telefon -->
      <q-input
        v-model="form.phone"
        filled
        type="tel"
        :label="t('ad.phoneRequired')"
        :rules="[
          (v) => !!v || t('common.required'),
          (v) => !v || v.length >= 5 || t('ad.minPhone'),
          (v) => !v || v.length <= 20 || t('ad.maxPhone'),
        ]"
        lazy-rules
      />

      <!-- Mijoz ismi -->
      <q-input
        v-model="form.clientName"
        filled
        :label="t('ad.contactName')"
        :rules="[
          (v) => !v || v.length >= 2 || t('common.minChars', { n: 2 }),
          (v) => !v || v.length <= 50 || t('common.maxChars', { n: 50 }),
        ]"
        lazy-rules
      />
    </section>

    <div v-if="errorMsg" class="text-negative text-sm">{{ errorMsg }}</div>

    <div class="flex justify-end gap-2">
      <q-btn flat :label="t('ad.reset')" @click="resetForm" />
      <q-btn color="primary" :label="t('ad.addBtn')" :loading="loading" type="submit" />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useQuasar, QForm } from 'quasar';
import { useI18n } from 'vue-i18n';
import { apiCreateAd, toLocationRef } from 'src/api';
import { useAuthStore } from 'stores/auth';
import { useLocationSearch } from 'src/composables/useLocationSearch';
import { useCountrySelect } from 'src/composables/useCountrySelect';
import { stripCountry } from 'src/utils/location';
import { getErrorMessage } from 'src/utils/error';
import {
  CREATE_AD_DIRECTION_KEY,
  CURRENCIES,
  PAYMENT_TYPES,
  TRUCK_TYPES,
  isDirection,
  type Direction,
} from 'src/constants';

const $q = useQuasar();
const { t } = useI18n();
const auth = useAuthStore();

const MONEY_RE = /^\d{1,16}(\.\d{1,4})?$/;

const formRef = ref<QForm | null>(null);
const loading = ref(false);
const errorMsg = ref('');

interface AdForm {
  direction: Direction;
  fromAddress: string;
  toAddress: string;
  truckType: string[] | null;
  loadName: string;
  descriptions: string;
  paymentType: string | null;
  advance: string;
  deliveryCost: string;
  currency: string;
  volume: number | null;
  weight: number | null;
  loadingTime: string;
  phone: string;
  clientName: string;
}

function savedDirection(): Direction {
  const saved = localStorage.getItem(CREATE_AD_DIRECTION_KEY);
  return isDirection(saved) ? saved : 'intercity';
}

function emptyForm(): AdForm {
  return {
    direction: savedDirection(),
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
  };
}

const form = reactive<AdForm>(emptyForm());

function locationLabel(label: string) {
  return form.direction === 'intercity' ? stripCountry(label) : label;
}

// ─── Country selector ──────────────────────────────────────────────────────────
const { countryId, countryOptions, loadDefaultCountry, filterCountry, onCountryScroll } =
  useCountrySelect();

// ─── Location search ───────────────────────────────────────────────────────────
const {
  fromOptions, toOptions,
  fromHasMore, toHasMore,
  loadInitial, filterFrom, filterTo,
  loadMoreFrom, loadMoreTo,
  clearOptions,
  pickLocation,
} = useLocationSearch(
  () => form.direction,
  () => (form.direction === 'intercity' && countryId.value ? countryId.value : undefined),
);

function onFromScroll(details: { to: number }) {
  if (details.to >= fromOptions.value.length - 3 && fromHasMore.value) void loadMoreFrom();
}
function onToScroll(details: { to: number }) {
  if (details.to >= toOptions.value.length - 3 && toHasMore.value) void loadMoreTo();
}

function reloadLocations() {
  if (form.direction === 'intercity') {
    void loadDefaultCountry().then(() => loadInitial());
  } else {
    void loadInitial();
  }
}

function onCountryChange() {
  form.fromAddress = '';
  form.toAddress = '';
  void loadInitial();
}

function onDirectionChange() {
  localStorage.setItem(CREATE_AD_DIRECTION_KEY, form.direction);
  form.fromAddress = '';
  form.toAddress = '';
  countryId.value = null;
  reloadLocations();
}

// Tozalashda foydalanuvchi tanlagan yo'nalish saqlanib qoladi
function resetForm() {
  Object.assign(form, emptyForm());
  countryId.value = null;
  errorMsg.value = '';
  formRef.value?.resetValidation();
  clearOptions();
  reloadLocations();
}

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
      fromLocation: toLocationRef(pickLocation(form.fromAddress)),
      toLocation: toLocationRef(pickLocation(form.toAddress)),
      truckType: form.truckType ?? [],
      ...(form.loadName && { loadName: form.loadName }),
      ...(form.descriptions && { descriptions: form.descriptions }),
      ...(form.paymentType && { paymentType: form.paymentType }),
      ...(form.advance && { advance: form.advance }),
      ...(form.deliveryCost && { deliveryCost: form.deliveryCost }),
      ...(form.currency && { currency: form.currency }),
      ...(typeof form.volume === 'number' && { volume: form.volume }),
      ...(typeof form.weight === 'number' && { weight: form.weight }),
      ...(form.loadingTime && { loadingTime: form.loadingTime }),
      phone: form.phone,
      ...(form.clientName && { clientName: form.clientName }),
    });
    $q.notify({ type: 'positive', message: t('ad.created') });
    resetForm();
  } catch (err: unknown) {
    errorMsg.value = getErrorMessage(err, t('common.error'));
  } finally {
    loading.value = false;
  }
}

onMounted(reloadLocations);
</script>
