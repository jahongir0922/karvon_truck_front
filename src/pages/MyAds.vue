<template>
  <q-page class="kt-page max-w-[960px]">
    <div class="flex items-center no-wrap gap-2 mb-4">
      <div class="min-w-0 flex-1">
        <div class="kt-page-title">{{ t('myAds.title') }}</div>
        <div v-if="ads.length" class="kt-page-subtitle">{{ t('myAds.count', { n: ads.length }) }}</div>
      </div>
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
      <q-btn
        v-if="ads.length && $q.screen.gt.xs"
        unelevated
        color="primary"
        icon="add"
        :label="t('nav.addLoad')"
        to="/create-ads"
      />
    </div>

    <div v-if="loading && !ads.length" class="flex flex-col gap-3">
      <q-card v-for="n in 3" :key="n" class="p-4 flex flex-col gap-3">
        <q-skeleton type="text" width="55%" height="22px" />
        <q-skeleton type="text" width="35%" />
        <q-skeleton type="text" width="25%" />
      </q-card>
    </div>

    <div v-else-if="!ads.length" class="kt-empty">
      <div class="kt-empty__icon"><q-icon name="inventory_2" size="34px" /></div>
      <div class="kt-empty__title">{{ t('myAds.noAds') }}</div>
      <q-btn unelevated color="primary" icon="add" class="mt-2" :label="t('nav.addLoad')" to="/create-ads" />
    </div>

    <div v-else class="flex flex-col gap-3">
      <q-card v-for="ad in ads" :key="ad._id" class="my-ad" :class="{ 'my-ad--inactive': !ad.isActive }">
        <div class="my-ad__main">
          <div class="kt-route my-ad__route">
            <div class="kt-route__point">
              <span class="kt-route__marker"><span class="kt-route__dot" /></span>
              <span class="kt-route__name">{{ ad.fromAddress }}</span>
            </div>
            <div class="kt-route__point">
              <span class="kt-route__marker"><span class="kt-route__pin" /></span>
              <span class="kt-route__name">{{ ad.toAddress }}</span>
            </div>
          </div>
          <span class="kt-tag shrink-0" :class="ad.isActive ? 'kt-tag--positive' : 'kt-tag--muted'">
            <q-icon :name="ad.isActive ? 'check_circle' : 'pause_circle'" size="14px" />
            {{ ad.isActive ? t('myAds.active') : t('myAds.inactive') }}
          </span>
        </div>

        <div class="my-ad__meta">
          <span v-if="formatMoney(ad.deliveryCost, ad.currency, locale)" class="my-ad__price">
            {{ formatMoney(ad.deliveryCost, ad.currency, locale) }}
          </span>
          <span v-if="ad.truckType?.length" class="my-ad__meta-item">
            <q-icon name="local_shipping" size="16px" />{{ ad.truckType.join(' / ') }}
          </span>
          <span v-if="ad.loadingTime" class="my-ad__meta-item">
            <q-icon name="event" size="16px" />{{ formatDate(ad.loadingTime, locale) }}
          </span>
          <span v-if="ad.phone" class="my-ad__meta-item">
            <q-icon name="call" size="16px" />{{ ad.phone }}
          </span>
        </div>

        <div class="my-ad__foot q--avoid-card-border">
          <span class="text-xs kt-muted">
            {{ t('ad.postedAt') }} {{ formatDateTime(ad.createdAt, locale) }}
          </span>
          <div class="flex items-center no-wrap gap-1">
            <q-btn flat round dense icon="edit" color="primary" :aria-label="t('common.edit')" @click="openEdit(ad)">
              <q-tooltip>{{ t('common.edit') }}</q-tooltip>
            </q-btn>
            <q-btn
              flat round dense
              :icon="ad.isActive ? 'visibility_off' : 'visibility'"
              :color="ad.isActive ? 'grey-7' : 'positive'"
              :loading="togglingId === ad._id"
              :aria-label="ad.isActive ? t('myAds.deactivate') : t('myAds.activate')"
              @click="toggleActive(ad)"
            >
              <q-tooltip>{{ ad.isActive ? t('myAds.deactivate') : t('myAds.activate') }}</q-tooltip>
            </q-btn>
            <q-btn
              flat round dense
              icon="delete_outline"
              color="negative"
              :loading="deletingId === ad._id"
              :aria-label="t('common.delete')"
              @click="askDelete(ad)"
            >
              <q-tooltip>{{ t('common.delete') }}</q-tooltip>
            </q-btn>
          </div>
        </div>
      </q-card>
    </div>

    <!-- Delete confirm dialog -->
    <q-dialog v-model="deleteDialog">
      <q-card class="w-full max-w-[400px] p-2">
        <q-card-section class="flex flex-col items-center text-center gap-2">
          <div class="kt-danger-icon"><q-icon name="delete_outline" size="28px" /></div>
          <div class="text-base font-semibold">{{ t('myAds.confirmDelete') }}</div>
          <div v-if="adToDelete" class="text-sm kt-muted">
            {{ adToDelete.fromAddress }} → {{ adToDelete.toAddress }}
          </div>
        </q-card-section>
        <q-card-actions class="grid grid-cols-2 gap-2 px-4 pb-4">
          <q-btn v-close-popup outline color="grey-8" :label="t('common.cancel')" />
          <q-btn
            unelevated
            color="negative"
            :label="t('common.delete')"
            :loading="deletingId !== null"
            @click="confirmDelete"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit dialog -->
    <q-dialog v-model="editDialog" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="kt-dialog-full flex flex-col no-wrap bg-[var(--kt-bg)]">
        <div class="kt-edit-head">
          <q-btn v-close-popup flat round dense icon="close" :aria-label="t('common.cancel')" />
          <span class="text-base font-bold">{{ t('myAds.editTitle') }}</span>
        </div>

        <q-scroll-area class="flex-1">
          <q-form ref="editFormRef" class="kt-edit-form" @submit.prevent="saveEdit">

            <q-btn-toggle
              v-model="editForm.direction"
              spread
              no-caps
              unelevated
              class="kt-segment"
              toggle-color="primary"
              color="white"
              text-color="grey-8"
              :options="directionOptions"
              @update:model-value="onEditDirectionChange"
            />

            <!-- Mamlakat (faqat shaharlararo) -->
            <q-select
              v-if="editForm.direction === 'intercity'"
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
              @update:model-value="onEditCountryChange"
              @virtual-scroll="onCountryScroll"
            >
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">{{ t('common.noOption') }}</q-item-section>
                </q-item>
              </template>
            </q-select>

            <section class="grid sm:grid-cols-2 gap-3">
              <q-select
                v-model="editForm.fromAddress"
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
                :rules="[(v) => !!v || t('common.required')]"
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

              <q-select
                v-model="editForm.toAddress"
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
                :rules="[(v) => !!v || t('common.required')]"
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

              <q-select v-model="editForm.truckType" filled multiple use-chips clearable
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

              <q-input v-model="editForm.loadName" filled :label="t('ad.cargoName')"
                :rules="[
                  (v) => !v || v.length >= 2 || t('common.minChars', { n: 2 }),
                  (v) => !v || v.length <= 50 || t('common.maxChars', { n: 50 }),
                ]" lazy-rules />

              <q-input v-model="editForm.descriptions" filled :label="t('ad.cargoDesc')"
                type="textarea" rows="2" class="sm:col-span-2" counter maxlength="500"
                :rules="[(v) => !v || v.length <= 500 || t('common.maxChars', { n: 500 })]" lazy-rules />

              <q-select v-model="editForm.paymentType" filled :label="t('ad.paymentType')"
                clearable :options="PAYMENT_TYPES" behavior="menu" />

              <div class="flex gap-2 items-start">
                <q-input v-model="editForm.advance" class="flex-1" filled inputmode="decimal" :label="t('ad.advance')"
                  :rules="[(v) => !v || MONEY_RE.test(v) || t('common.onlyNumber')]" lazy-rules />
                <q-input v-model="editForm.deliveryCost" class="flex-1" filled inputmode="decimal" :label="t('ad.price')"
                  :rules="[(v) => !v || MONEY_RE.test(v) || t('common.onlyNumber')]" lazy-rules />
                <q-select v-model="editForm.currency" filled :options="CURRENCIES"
                  behavior="menu" style="min-width: 80px" />
              </div>

              <q-input v-model.number="editForm.volume" filled :label="t('ad.volume')" type="number"
                :rules="[
                  (v) => v === null || v === '' || v >= 2 || t('ad.minVolume'),
                  (v) => v === null || v === '' || v <= 10000 || t('ad.maxVolume'),
                ]" lazy-rules />
              <q-input v-model.number="editForm.weight" filled :label="t('ad.weight')" type="number"
                :rules="[
                  (v) => v === null || v === '' || v >= 2 || t('ad.minWeight'),
                  (v) => v === null || v === '' || v <= 50 || t('ad.maxWeight'),
                ]" lazy-rules />

              <q-input v-model="editForm.loadingTime" filled :label="t('ad.loadingTime')" type="date" />

              <q-input v-model="editForm.phone" filled type="tel" :label="t('ad.phoneRequired')"
                :rules="[
                  (v) => !!v || t('common.required'),
                  (v) => !v || v.length >= 5 || t('ad.minPhone'),
                  (v) => !v || v.length <= 20 || t('ad.maxPhone'),
                ]"
                lazy-rules />

              <q-input v-model="editForm.clientName" filled :label="t('ad.contactName')"
                :rules="[
                  (v) => !v || v.length >= 2 || t('common.minChars', { n: 2 }),
                  (v) => !v || v.length <= 50 || t('common.maxChars', { n: 50 }),
                ]" lazy-rules />
            </section>

            <div v-if="editError" class="text-negative text-sm">{{ editError }}</div>

            <div class="flex justify-end gap-2 pt-2">
              <q-btn v-close-popup outline color="grey-8" class="h-12 px-5" :label="t('common.cancel')" />
              <q-btn
                unelevated
                color="primary"
                icon="check"
                class="h-12 px-6"
                :label="t('common.save')"
                :loading="saving"
                type="submit"
              />
            </div>
          </q-form>
        </q-scroll-area>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useQuasar, QForm } from 'quasar';
import { useI18n } from 'vue-i18n';
import { apiGetMyAds, apiUpdateAd, apiDeleteAd, toLocationRef } from 'src/api';
import { useLocationSearch } from 'src/composables/useLocationSearch';
import { useCountrySelect } from 'src/composables/useCountrySelect';
import { stripCountry } from 'src/utils/location';
import { getErrorMessage } from 'src/utils/error';
import { formatDate, formatDateTime, formatMoney } from 'src/utils/format';
import { CURRENCIES, PAYMENT_TYPES, TRUCK_TYPES, isDirection, type Direction } from 'src/constants';
import type { Advertisement, AdUpdateDto } from 'src/types';

const $q = useQuasar();
const { t, locale } = useI18n();

const MONEY_RE = /^\d{1,16}(\.\d{1,4})?$/;

const loading = ref(false);
const ads = ref<Advertisement[]>([]);
const togglingId = ref<string | null>(null);
const deletingId = ref<string | null>(null);
const deleteDialog = ref(false);
const adToDelete = ref<Advertisement | null>(null);

const editDialog = ref(false);
const editFormRef = ref<QForm | null>(null);
const saving = ref(false);
const editError = ref('');
let editingId = '';

interface EditForm {
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

const editForm = reactive<EditForm>({
  direction: 'intercity',
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

const directionOptions = computed(() => [
  { value: 'intercity', label: t('ad.intercity'), icon: 'alt_route' },
  { value: 'international', label: t('ad.international'), icon: 'public' },
]);

function locationLabel(label: string) {
  return editForm.direction === 'intercity' ? stripCountry(label) : label;
}

// ─── Country / locations ──────────────────────────────────────────────────────
const { countryId, countryOptions, loadDefaultCountry, filterCountry, onCountryScroll } =
  useCountrySelect();

const {
  fromOptions, toOptions,
  fromHasMore, toHasMore,
  loadInitial, filterFrom, filterTo,
  loadMoreFrom, loadMoreTo,
  clearOptions,
  pickLocation,
} = useLocationSearch(
  () => editForm.direction,
  () => (editForm.direction === 'intercity' && countryId.value ? countryId.value : undefined),
);

function onFromScroll(details: { to: number }) {
  if (details.to >= fromOptions.value.length - 3 && fromHasMore.value) void loadMoreFrom();
}
function onToScroll(details: { to: number }) {
  if (details.to >= toOptions.value.length - 3 && toHasMore.value) void loadMoreTo();
}

function reloadLocations() {
  if (editForm.direction === 'intercity') {
    void loadDefaultCountry().then(() => loadInitial());
  } else {
    void loadInitial();
  }
}

function onEditDirectionChange() {
  countryId.value = null;
  editForm.fromAddress = '';
  editForm.toAddress = '';
  reloadLocations();
}

function onEditCountryChange() {
  editForm.fromAddress = '';
  editForm.toAddress = '';
  void loadInitial();
}

// ─── Data ─────────────────────────────────────────────────────────────────────
async function loadAds() {
  loading.value = true;
  try {
    const res = await apiGetMyAds();
    ads.value = res.data.data;
  } catch {
    // interceptor xabar beradi
  } finally {
    loading.value = false;
  }
}

function replaceAd(updated: Advertisement) {
  const idx = ads.value.findIndex((a) => a._id === updated._id);
  if (idx >= 0) ads.value[idx] = updated;
}

function openEdit(ad: Advertisement) {
  editingId = ad._id;
  editForm.direction = isDirection(ad.direction) ? ad.direction : 'intercity';
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
  countryId.value = null;
  clearOptions();
  editError.value = '';
  editDialog.value = true;
  reloadLocations();
}

async function saveEdit() {
  editError.value = '';
  const valid = await editFormRef.value?.validate();
  if (!valid) return;

  // Bo'sh qoldirilgan ixtiyoriy maydonlar null bilan yuboriladi — backend ularni tozalaydi.
  // (Avval ular yuborilmasdi va eski qiymat o'chirilmay qolardi.)
  // Manzil ro'yxatdan tanlangan bo'lsa ID'lari ketadi, aks holda backend matndan aniqlaydi (null)
  const payload: AdUpdateDto = {
    direction: editForm.direction,
    fromAddress: editForm.fromAddress,
    toAddress: editForm.toAddress,
    fromLocation: toLocationRef(pickLocation(editForm.fromAddress)) ?? null,
    toLocation: toLocationRef(pickLocation(editForm.toAddress)) ?? null,
    truckType: editForm.truckType ?? [],
    loadName: editForm.loadName || null,
    descriptions: editForm.descriptions || null,
    paymentType: editForm.paymentType || null,
    advance: editForm.advance || null,
    deliveryCost: editForm.deliveryCost || null,
    currency: editForm.currency || null,
    volume: typeof editForm.volume === 'number' ? editForm.volume : null,
    weight: typeof editForm.weight === 'number' ? editForm.weight : null,
    loadingTime: editForm.loadingTime || null,
    phone: editForm.phone,
    clientName: editForm.clientName || null,
  };

  saving.value = true;
  try {
    const res = await apiUpdateAd(editingId, payload);
    replaceAd(res.data.data);
    editDialog.value = false;
    $q.notify({ type: 'positive', message: t('myAds.updated') });
  } catch (err: unknown) {
    editError.value = getErrorMessage(err, t('common.error'));
  } finally {
    saving.value = false;
  }
}

async function toggleActive(ad: Advertisement) {
  togglingId.value = ad._id;
  try {
    const res = await apiUpdateAd(ad._id, { isActive: !ad.isActive });
    replaceAd(res.data.data);
  } catch (err: unknown) {
    $q.notify({ type: 'negative', message: getErrorMessage(err, t('common.error')) });
  } finally {
    togglingId.value = null;
  }
}

function askDelete(ad: Advertisement) {
  adToDelete.value = ad;
  deleteDialog.value = true;
}

async function confirmDelete() {
  const ad = adToDelete.value;
  if (!ad) return;

  deletingId.value = ad._id;
  try {
    await apiDeleteAd(ad._id);
    ads.value = ads.value.filter((a) => a._id !== ad._id);
    deleteDialog.value = false;
    adToDelete.value = null;
    $q.notify({ type: 'positive', message: t('myAds.deleted') });
  } catch (err: unknown) {
    $q.notify({ type: 'negative', message: getErrorMessage(err, t('common.error')) });
  } finally {
    deletingId.value = null;
  }
}

onMounted(() => { void loadAds(); });
</script>

<style scoped>
.my-ad {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 16px 8px;
  transition: opacity 0.2s ease;
}
.my-ad--inactive {
  background: #fafbfc;
}
.my-ad--inactive .my-ad__main,
.my-ad--inactive .my-ad__meta {
  opacity: 0.6;
}
.my-ad__main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.my-ad__route {
  flex: 1 1 auto;
}
.my-ad__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 16px;
  font-size: 14px;
  color: var(--kt-text-2);
}
.my-ad__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.my-ad__meta-item .q-icon {
  color: var(--kt-muted);
}
.my-ad__price {
  font-weight: 800;
  color: var(--kt-primary-dark);
}
.my-ad__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 6px;
  border-top: 1px solid var(--kt-border);
}

.kt-danger-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 4px;
  border-radius: 50%;
  background: #fdecec;
  color: var(--q-negative);
}

.kt-edit-head {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 56px;
  padding: 0 12px;
  background: var(--kt-surface);
  border-bottom: 1px solid var(--kt-border);
}
.kt-edit-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 820px;
  margin: 16px auto;
  padding: 16px;
  border: 1px solid var(--kt-border);
  border-radius: var(--kt-radius);
  background: var(--kt-surface);
}
@media (max-width: 599px) {
  .kt-edit-form {
    margin: 0;
    border: 0;
    border-radius: 0;
  }
}
</style>
