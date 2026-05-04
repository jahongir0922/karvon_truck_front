<template>
  <q-page class="p-3 max-w-[900px] mx-auto">
    <div class="text-lg font-bold mb-4">{{ t('myAds.title') }}</div>

    <div v-if="loading" class="text-center py-10">
      <q-spinner size="40px" color="primary" />
    </div>

    <div v-else-if="!ads.length" class="text-center text-grey-6 py-10">
      {{ t('myAds.noAds') }}
    </div>

    <div v-else class="flex flex-col gap-3">
      <q-card v-for="ad in ads" :key="ad._id" class="p-4">
        <div class="flex justify-between items-start gap-2">
          <div>
            <div class="flex items-center gap-1 font-bold text-primary mb-1">
              <span>{{ ad.fromAddress }}</span>
              <q-icon name="arrow_forward" />
              <span>{{ ad.toAddress }}</span>
            </div>
            <div class="text-sm text-grey-7 flex flex-wrap gap-x-4 gap-y-1">
              <span v-if="ad.truckType?.length">{{ ad.truckType.join(' / ') }}</span>
              <span v-if="ad.deliveryCost">{{ ad.deliveryCost }} {{ ad.currency }}</span>
              <span v-if="ad.phone">{{ ad.phone }}</span>
              <span v-if="ad.loadingTime">{{ new Date(ad.loadingTime).toLocaleDateString('uz-UZ') }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <q-badge :color="ad.isActive ? 'positive' : 'grey'">
              {{ ad.isActive ? t('myAds.active') : t('myAds.inactive') }}
            </q-badge>
            <q-btn flat round dense icon="edit" color="primary" @click="openEdit(ad)" />
            <q-btn
              flat round dense
              :icon="ad.isActive ? 'visibility_off' : 'visibility'"
              :color="ad.isActive ? 'grey' : 'positive'"
              :loading="togglingId === ad._id"
              @click="toggleActive(ad)"
            />
          </div>
        </div>
      </q-card>
    </div>

    <!-- Edit dialog -->
    <q-dialog v-model="editDialog" maximized>
      <q-card class="flex flex-col">
        <q-bar class="bg-primary text-white">
          <span class="font-bold">{{ t('myAds.editTitle') }}</span>
          <q-space />
          <q-btn flat dense icon="close" v-close-popup />
        </q-bar>

        <q-scroll-area class="flex-1">
          <q-form ref="editFormRef" class="flex flex-col p-4 gap-3 max-w-[800px] mx-auto" @submit.prevent="saveEdit">

            <div class="flex gap-4">
              <q-radio v-model="editForm.direction" val="international" :label="t('ad.international')"
                @update:model-value="onEditDirectionChange" />
              <q-radio v-model="editForm.direction" val="intercity" :label="t('ad.intercity')"
                @update:model-value="onEditDirectionChange" />
            </div>

            <!-- Mamlakat (faqat shaharlararo) -->
            <q-select
              v-if="editForm.direction === 'intercity'"
              filled
              v-model="editForm.countryId"
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
              @update:model-value="onEditCountryChange"
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

            <section class="grid sm:grid-cols-2 gap-3">
              <q-select
                filled
                v-model="editForm.fromAddress"
                use-input
                clearable
                input-debounce="400"
                :label="t('ad.fromRequired')"
                :options="fromOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                @filter="filterFrom"
                @virtual-scroll="(e) => onFromScroll(e.to)"
                behavior="menu"
                :rules="[(v) => !!v || t('common.required')]"
                lazy-rules
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
                v-model="editForm.toAddress"
                use-input
                clearable
                input-debounce="400"
                :label="t('ad.toRequired')"
                :options="toOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                @filter="filterTo"
                @virtual-scroll="(e) => onToScroll(e.to)"
                behavior="menu"
                :rules="[(v) => !!v || t('common.required')]"
                lazy-rules
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

              <q-select filled v-model="editForm.truckType" multiple use-chips clearable
                :label="t('ad.truckType')" :options="TRUCK_TYPES" behavior="menu">
                <template #option="{ itemProps, opt, selected, toggleOption }">
                  <q-item v-bind="itemProps">
                    <q-item-section>{{ opt }}</q-item-section>
                    <q-item-section side>
                      <q-toggle :model-value="selected" @update:model-value="toggleOption(opt)" />
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <q-input filled v-model="editForm.loadName" :label="t('ad.cargoName')"
                :rules="[(v) => !v || v.length >= 2 || t('common.minChars', { n: 2 })]" lazy-rules />

              <q-input filled v-model="editForm.descriptions" :label="t('ad.cargoDesc')"
                type="textarea" rows="2" class="sm:col-span-2"
                :rules="[(v) => !v || v.length <= 500 || t('common.maxChars', { n: 500 })]" lazy-rules />

              <q-select filled v-model="editForm.paymentType" :label="t('ad.paymentType')"
                clearable :options="PAYMENT_TYPES" behavior="menu" />

              <div class="flex gap-2 items-start">
                <q-input class="flex-1" filled v-model="editForm.advance" :label="t('ad.advance')"
                  :rules="[(v) => !v || /^\d{1,16}(\.\d{1,4})?$/.test(v) || t('common.onlyNumber')]" lazy-rules />
                <q-input class="flex-1" filled v-model="editForm.deliveryCost" :label="t('ad.price')"
                  :rules="[(v) => !v || /^\d{1,16}(\.\d{1,4})?$/.test(v) || t('common.onlyNumber')]" lazy-rules />
                <q-select filled v-model="editForm.currency" :options="CURRENCIES"
                  behavior="menu" style="min-width: 80px" />
              </div>

              <q-input filled v-model.number="editForm.volume" :label="t('ad.volume')" type="number"
                :rules="[(v) => v === null || v === '' || v >= 2 || t('ad.minVolume')]" lazy-rules />
              <q-input filled v-model.number="editForm.weight" :label="t('ad.weight')" type="number"
                :rules="[(v) => v === null || v === '' || v >= 2 || t('ad.minWeight')]" lazy-rules />

              <q-input filled v-model="editForm.loadingTime" :label="t('ad.loadingTime')" type="date" />

              <q-input filled v-model="editForm.phone" :label="t('ad.phoneRequired')"
                :rules="[(v) => !!v || t('common.required'), (v) => !v || v.length >= 5 || t('ad.minPhone')]"
                lazy-rules />

              <q-input filled v-model="editForm.clientName" :label="t('ad.contactName')"
                :rules="[(v) => !v || v.length >= 2 || t('common.minChars', { n: 2 })]" lazy-rules />
            </section>

            <div v-if="editError" class="text-negative text-sm">{{ editError }}</div>

            <div class="flex justify-end gap-2">
              <q-btn flat :label="t('common.cancel')" v-close-popup />
              <q-btn color="primary" :label="t('common.save')" :loading="saving" type="submit" />
            </div>
          </q-form>
        </q-scroll-area>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useQuasar, QForm } from 'quasar';
import { useI18n } from 'vue-i18n';
import { apiGetMyAds, apiUpdateAd, apiGetCountries } from 'src/api';
import { useLocationSearch } from 'src/composables/useLocationSearch';
import type { Advertisement, Country } from 'src/types';

const $q = useQuasar();
const { t } = useI18n();

const TRUCK_TYPES = ['Tent', 'Ref', 'Plashchaniy', 'Konteyner', 'Bortovoy', 'Samosvал'];
const PAYMENT_TYPES = ['Naqd', "Pul o'tkazish"];
const CURRENCIES = ['UZS', 'USD', 'RUB'];

const loading = ref(false);
const ads = ref<Advertisement[]>([]);
const togglingId = ref<string | null>(null);

const editDialog = ref(false);
const editFormRef = ref<QForm | null>(null);
const saving = ref(false);
const editError = ref('');
let editingId = '';

interface CountryOption { label: string; value: number }

interface EditForm {
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

const countryOptions = ref<CountryOption[]>([]);

function toCountryOption(c: Country): CountryOption {
  const label = c.translations?.['uz'] ?? c.translations?.['ru'] ?? c.name;
  return { label, value: c.id };
}

function filterCountry(val: string, update: (fn: () => void) => void) {
  void apiGetCountries({ q: val || 'a', limit: 30 }).then((res) => {
    update(() => { countryOptions.value = res.data.data.map(toCountryOption); });
  });
}

async function loadDefaultCountry() {
  const res = await apiGetCountries({ q: 'uzbek', limit: 30 });
  countryOptions.value = res.data.data.map(toCountryOption);
  if (editForm.countryId === null) {
    const uz = res.data.data.find((c) => c.iso2 === 'UZ') ?? res.data.data[0];
    if (uz) editForm.countryId = uz.id;
  }
}

const {
  fromOptions, toOptions,
  fromHasMore, toHasMore,
  loadInitial, filterFrom, filterTo,
  loadMoreFrom, loadMoreTo,
  clearOptions,
} = useLocationSearch(
  () => editForm.direction,
  () => (editForm.direction === 'intercity' && editForm.countryId ? editForm.countryId : undefined),
);

function onFromScroll(to: number) {
  if (to >= fromOptions.value.length - 3 && fromHasMore.value) void loadMoreFrom();
}
function onToScroll(to: number) {
  if (to >= toOptions.value.length - 3 && toHasMore.value) void loadMoreTo();
}

function onEditDirectionChange() {
  editForm.countryId = null;
  editForm.fromAddress = '';
  editForm.toAddress = '';
  if (editForm.direction === 'intercity') {
    void loadDefaultCountry().then(() => loadInitial());
  } else {
    void loadInitial();
  }
}

function onEditCountryChange() {
  editForm.fromAddress = '';
  editForm.toAddress = '';
  void loadInitial();
}

const editForm = reactive<EditForm>({
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

async function loadAds() {
  loading.value = true;
  try {
    const res = await apiGetMyAds();
    ads.value = res.data.data;
  } finally {
    loading.value = false;
  }
}

function openEdit(ad: Advertisement) {
  editingId = ad._id;
  editForm.direction = (ad.direction as 'international' | 'intercity') ?? 'intercity';
  editForm.fromAddress = ad.fromAddress;
  editForm.toAddress = ad.toAddress;
  editForm.truckType = [...(ad.truckType ?? [])];
  editForm.loadName = ad.loadName ?? '';
  editForm.descriptions = ad.descriptions ?? '';
  editForm.paymentType = ad.paymentType ?? '';
  editForm.advance = ad.advance ? String(ad.advance) : '';
  editForm.deliveryCost = ad.deliveryCost ? String(ad.deliveryCost) : '';
  editForm.currency = ad.currency ?? 'UZS';
  editForm.volume = ad.volume ?? null;
  editForm.weight = ad.weight ?? null;
  editForm.loadingTime = ad.loadingTime ?? '';
  editForm.phone = ad.phone;
  editForm.clientName = ad.clientName ?? '';
  editForm.countryId = null;
  clearOptions();
  editError.value = '';
  editDialog.value = true;
  if (editForm.direction === 'intercity') {
    void loadDefaultCountry().then(() => loadInitial());
  } else {
    void loadInitial();
  }
}

async function saveEdit() {
  editError.value = '';
  const valid = await editFormRef.value?.validate();
  if (!valid) return;

  saving.value = true;
  try {
    const res = await apiUpdateAd(editingId, {
      direction: editForm.direction,
      fromAddress: editForm.fromAddress,
      toAddress: editForm.toAddress,
      truckType: editForm.truckType,
      ...(editForm.loadName && { loadName: editForm.loadName }),
      ...(editForm.descriptions && { descriptions: editForm.descriptions }),
      ...(editForm.paymentType && { paymentType: editForm.paymentType }),
      ...(editForm.advance && { advance: editForm.advance }),
      ...(editForm.deliveryCost && { deliveryCost: editForm.deliveryCost }),
      ...(editForm.currency && { currency: editForm.currency }),
      ...(editForm.volume !== null && { volume: editForm.volume }),
      ...(editForm.weight !== null && { weight: editForm.weight }),
      ...(editForm.loadingTime && { loadingTime: editForm.loadingTime }),
      phone: editForm.phone,
      ...(editForm.clientName && { clientName: editForm.clientName }),
    });
    const idx = ads.value.findIndex((a) => a._id === editingId);
    if (idx >= 0) ads.value[idx] = res.data.data;
    editDialog.value = false;
    $q.notify({ type: 'positive', message: t('myAds.updated') });
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
    editError.value = Array.isArray(msg) ? msg.join(', ') : typeof msg === 'string' ? msg : t('common.error');
  } finally {
    saving.value = false;
  }
}

async function toggleActive(ad: Advertisement) {
  togglingId.value = ad._id;
  try {
    const res = await apiUpdateAd(ad._id, { isActive: !ad.isActive });
    const idx = ads.value.findIndex((a) => a._id === ad._id);
    if (idx >= 0) ads.value[idx] = res.data.data;
  } finally {
    togglingId.value = null;
  }
}

onMounted(() => { void loadAds(); });
</script>
