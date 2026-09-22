<template>
  <q-page class="kt-page">
    <q-form ref="formRef" class="kt-form" @submit.prevent="submitAd">
      <div>
        <div class="kt-page-title">{{ t('ad.newAd') }}</div>
        <div class="kt-page-subtitle">{{ t('ad.newAdHint') }}</div>
      </div>

      <q-banner v-if="!auth.isLoggedIn" rounded class="kt-hint">
        <template #avatar><q-icon name="info" color="primary" /></template>
        {{ t('ad.loginHint') }}
        <template #action>
          <q-btn
            flat
            color="primary"
            :label="t('nav.login')"
            :to="{ path: '/login', query: { redirect: '/create-ads' } }"
          />
        </template>
      </q-banner>

      <!-- 1. Yo'nalish -->
      <q-card class="kt-form-card">
        <div class="kt-section-title">
          <q-icon name="alt_route" size="20px" />
          {{ t('ad.sectionRoute') }}
        </div>

        <q-btn-toggle
          v-model="form.direction"
          spread
          no-caps
          unelevated
          class="kt-segment q--avoid-card-border mb-3"
          toggle-color="primary"
          color="white"
          text-color="grey-8"
          :options="directionOptions"
          @update:model-value="onDirectionChange"
        />

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
          class="kt-field"
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

        <div class="grid sm:grid-cols-2 gap-x-3">
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
        </div>
      </q-card>

      <!-- 2. Yuk haqida -->
      <q-card class="kt-form-card">
        <div class="kt-section-title">
          <q-icon name="inventory_2" size="20px" />
          {{ t('ad.sectionCargo') }}
        </div>

        <div class="grid sm:grid-cols-2 gap-x-3">
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
            class="kt-field"
          >
            <template #prepend><q-icon name="local_shipping" size="20px" /></template>
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

          <!-- Vazn va hajm -->
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
          >
            <template #prepend><q-icon name="scale" size="20px" /></template>
          </q-input>
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
          >
            <template #prepend><q-icon name="view_in_ar" size="20px" /></template>
          </q-input>

          <!-- Yuklash vaqti -->
          <q-input
            v-model="form.loadingTime"
            filled
            stack-label
            :label="t('ad.loadingTime')"
            type="date"
            class="kt-field"
          >
            <template #prepend><q-icon name="event" size="20px" /></template>
          </q-input>

          <!-- Yuk tavsifi -->
          <q-input
            v-model="form.descriptions"
            filled
            autogrow
            :label="t('ad.cargoDesc')"
            type="textarea"
            class="sm:col-span-2"
            counter
            maxlength="500"
            :rules="[(v) => !v || v.length <= 500 || t('common.maxChars', { n: 500 })]"
            lazy-rules
          />
        </div>
      </q-card>

      <!-- 3. Narx va to'lov -->
      <q-card class="kt-form-card">
        <div class="kt-section-title">
          <q-icon name="payments" size="20px" />
          {{ t('ad.sectionPrice') }}
        </div>

        <div class="kt-price-grid">
          <q-input
            v-model="form.deliveryCost"
            filled
            inputmode="decimal"
            class="kt-price-grid__cost"
            :label="t('ad.price')"
            :rules="[(v) => !v || MONEY_RE.test(v) || t('common.onlyNumber')]"
            lazy-rules
          />
          <q-select
            v-model="form.currency"
            filled
            :options="CURRENCIES"
            behavior="menu"
            class="kt-field kt-price-grid__currency"
          />
          <q-input
            v-model="form.advance"
            filled
            inputmode="decimal"
            class="kt-price-grid__advance"
            :label="t('ad.advance')"
            :rules="[(v) => !v || MONEY_RE.test(v) || t('common.onlyNumber')]"
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
            class="kt-field kt-price-grid__payment"
          />
        </div>
      </q-card>

      <!-- 4. Aloqa -->
      <q-card class="kt-form-card">
        <div class="kt-section-title">
          <q-icon name="call" size="20px" />
          {{ t('ad.sectionContact') }}
        </div>

        <div class="grid sm:grid-cols-2 gap-x-3">
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
          >
            <template #prepend><q-icon name="phone" size="20px" /></template>
          </q-input>

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
          >
            <template #prepend><q-icon name="person" size="20px" /></template>
          </q-input>
        </div>
      </q-card>

      <div v-if="errorMsg" class="kt-error">
        <q-icon name="error_outline" size="20px" />
        {{ errorMsg }}
      </div>

      <div class="kt-form-actions">
        <q-btn outline color="grey-8" icon="restart_alt" :label="t('ad.reset')" @click="resetForm" />
        <q-btn
          unelevated
          color="primary"
          icon="check"
          class="kt-form-actions__submit"
          :label="t('ad.addBtn')"
          :loading="loading"
          type="submit"
        />
      </div>
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
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

const directionOptions = computed(() => [
  { value: 'intercity', label: t('ad.intercity'), icon: 'alt_route' },
  { value: 'international', label: t('ad.international'), icon: 'public' },
]);

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

<style scoped>
.kt-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 820px;
  margin: 0 auto;
}
/* Qoidasi (rules) bor maydonlar ostida xato uchun 20px joy bor; qoidasiz maydonlarga (.kt-field)
   ham shuncha joy beramiz — aks holda qatorlar bir tekis turmaydi */
.kt-form-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 16px 4px;
}
@media (min-width: 600px) {
  .kt-form-card {
    padding: 20px 20px 8px;
  }
}
.kt-field {
  padding-bottom: 20px;
}

/* Narx | valyuta, keyin avans | to'lov turi; katta ekranda bitta qatorda narx+valyuta */
.kt-price-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 100px;
  column-gap: 12px;
}
.kt-price-grid__advance,
.kt-price-grid__payment {
  grid-column: 1 / -1;
}
@media (min-width: 600px) {
  .kt-price-grid {
    grid-template-columns: minmax(0, 1fr) 110px minmax(0, 1fr);
  }
  .kt-price-grid__advance {
    grid-column: auto;
  }
}

.kt-hint {
  background: var(--kt-primary-soft);
  color: var(--kt-text);
  border-radius: var(--kt-radius-sm);
}
.kt-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: var(--kt-radius-sm);
  background: #fdecec;
  color: var(--q-negative);
  font-size: 14px;
}

/* Telefonda tugmalar ekran pastiga yopishib turadi — uzun formani oxirigacha aylantirish shart emas */
.kt-form-actions {
  position: sticky;
  bottom: 0;
  z-index: 1;
  display: flex;
  gap: 8px;
  margin: 0 -12px -24px;
  padding: 12px 12px 16px;
  background: linear-gradient(to top, var(--kt-bg) 75%, rgba(243, 245, 250, 0));
}
.kt-form-actions :deep(.q-btn) {
  height: 48px;
}
.kt-form-actions__submit {
  flex: 1 1 auto;
  font-size: 15px;
}
@media (min-width: 600px) {
  .kt-form-actions {
    position: static;
    justify-content: flex-end;
    margin: 0;
    padding: 0;
    background: none;
  }
  .kt-form-actions__submit {
    flex: 0 0 auto;
    padding: 0 28px;
  }
}
</style>
