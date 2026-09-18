<template>
  <div>
    <div class="flex justify-between items-center mb-3 gap-2 flex-wrap">
      <q-select
        v-model="countryId"
        dense
        outlined
        use-input
        input-debounce="400"
        :placeholder="t('ad.country')"
        :options="countryOptions"
        option-label="label"
        option-value="value"
        emit-value
        map-options
        clearable
        class="flex-1 max-w-[220px]"
        behavior="menu"
        @filter="filterCountry"
        @update:model-value="onCountryChange"
        @virtual-scroll="onCountryScroll"
      >
        <template #no-option>
          <q-item>
            <q-item-section class="text-grey">{{ t('common.notFound') }}</q-item-section>
          </q-item>
        </template>
      </q-select>
      <q-select
        v-model="provinceId"
        dense
        outlined
        :options="provinceOptions"
        option-label="label"
        option-value="value"
        emit-value
        map-options
        clearable
        :disable="!countryId"
        :placeholder="t('admin.province')"
        class="flex-1 max-w-[220px]"
        behavior="menu"
        @update:model-value="loadCities"
      >
        <template #no-option>
          <q-item>
            <q-item-section class="text-grey">{{ t('common.notFound') }}</q-item-section>
          </q-item>
        </template>
      </q-select>
      <q-input
        v-model="search"
        dense
        outlined
        clearable
        :placeholder="t('common.search')"
        debounce="400"
        class="flex-1 max-w-[200px]"
        @update:model-value="loadCities"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <q-btn color="primary" icon="add" :label="t('common.add')" @click="openCreate" />
    </div>

    <q-table
      :rows="cities"
      :columns="columns"
      row-key="_id"
      flat
      bordered
      :loading="loading"
      :rows-per-page-label="t('common.rowsPerPage')"
      :no-data-label="hasFilter ? t('common.noData') : t('admin.selectCountry')"
      :pagination="{ rowsPerPage: 15 }"
    >
      <template #body-cell-index="{ rowIndex }">
        <q-td>{{ rowIndex + 1 }}</q-td>
      </template>
      <template #body-cell-translation="{ row }">
        <q-td>{{ translatedName(row.translations, locale, '') || '—' }}</q-td>
      </template>
      <template #body-cell-country_name="{ row }">
        <q-td>{{ countryLabelById[row.country_id] ?? row.country_name }}</q-td>
      </template>
      <template #body-cell-state="{ row }">
        <q-td>{{ row.state_name || row.state_id || '—' }}</q-td>
      </template>
      <template #body-cell-actions="{ row }">
        <q-td class="text-right">
          <q-btn flat round dense icon="edit" color="primary" :aria-label="t('common.edit')" @click="openEdit(row)" />
          <q-btn flat round dense icon="delete" color="negative" :aria-label="t('common.delete')" @click="confirmDelete(row)" />
        </q-td>
      </template>
    </q-table>

    <!-- Dialog -->
    <q-dialog v-model="dialog" persistent>
      <q-card style="min-width: 420px; max-width: 95vw">
        <q-form @submit.prevent="save">
          <q-bar class="bg-primary text-white">
            <span class="font-bold">{{ form._id ? t('common.edit') : t('admin.newCity') }}</span>
            <q-space />
            <q-btn v-close-popup flat dense icon="close" :aria-label="t('common.cancel')" />
          </q-bar>
          <q-card-section class="flex flex-col gap-3">
            <q-input
              v-if="!form._id"
              v-model.number="form.id"
              :label="t('admin.id')"
              dense
              filled
              type="number"
              :rules="[(v) => (v !== null && v !== '') || t('common.required')]"
            />
            <q-input
              v-model="form.name"
              :label="t('admin.nameRequired')"
              dense
              filled
              :rules="[(v) => !!v || t('common.required')]"
            />
            <q-input
              v-model.number="form.country_id"
              :label="t('admin.countryIdRequired')"
              dense
              filled
              type="number"
              :rules="[(v) => (v !== null && v !== '') || t('common.required')]"
            />
            <q-input
              v-model="form.country_code"
              :label="t('admin.countryCodeRequired')"
              dense
              filled
              maxlength="2"
              :rules="[(v) => !!v || t('common.required')]"
            />
            <q-input
              v-model="form.country_name"
              :label="t('admin.countryNameRequired')"
              dense
              filled
              :rules="[(v) => !!v || t('common.required')]"
            />
            <q-input v-model.number="form.state_id" :label="t('admin.stateId')" dense filled type="number" />
            <q-input v-model="form.state_name" :label="t('admin.stateName')" dense filled />
            <q-input v-model="form.state_code" :label="t('admin.stateCode')" dense filled />
            <div class="text-sm font-bold mt-1">{{ t('common.translations') }}</div>
            <div class="grid grid-cols-3 gap-2">
              <q-input v-model="form.translations.uz" label="UZ" dense filled />
              <q-input v-model="form.translations.ru" label="RU" dense filled />
              <q-input v-model="form.translations.en" label="EN" dense filled />
            </div>
            <div v-if="error" class="text-negative text-sm">{{ error }}</div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn v-close-popup flat :label="t('common.cancel')" />
            <q-btn color="primary" :label="t('common.save')" :loading="saving" type="submit" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- O'chirish -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-base">{{ t('common.confirmDelete') }}</div>
          <div class="text-sm text-grey-7 mt-1">{{ deleteTarget?.name }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="t('common.cancel')" />
          <q-btn color="negative" :label="t('common.delete')" :loading="saving" @click="executeDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import {
  apiGetCities,
  apiGetProvincesByCountry,
  apiAdminCreateCity,
  apiAdminUpdateCity,
  apiAdminDeleteCity,
} from 'src/api';
import { useCountrySelect } from 'src/composables/useCountrySelect';
import { getErrorMessage } from 'src/utils/error';
import { translatedName } from 'src/utils/location';
import type { City } from 'src/types';

interface ProvinceOption {
  label: string;
  value: number;
  name: string;
  state_code: string;
}

const $q = useQuasar();
const { t, locale } = useI18n();
const {
  countryId, countryOptions, selectedCountry, countryLabelById,
  loadCountryOptions, filterCountry, onCountryScroll,
} = useCountrySelect();

const cities = ref<City[]>([]);
const loading = ref(false);
const provinceId = ref<number | null>(null);
const search = ref<string | null>('');
const provinceOptions = ref<ProvinceOption[]>([]);
const dialog = ref(false);
const saving = ref(false);
const error = ref('');
const deleteDialog = ref(false);
const deleteTarget = ref<{ name: string; _id: string } | null>(null);

const hasFilter = computed(() => !!countryId.value || !!provinceId.value || !!search.value);

const selectedProvince = computed<ProvinceOption | null>(
  () => provinceOptions.value.find((p) => p.value === provinceId.value) ?? null,
);

const columns = computed<QTableColumn[]>(() => [
  { name: 'index', label: '#', field: 'index', align: 'left' },
  { name: 'id', label: 'ID', field: 'id', sortable: true, align: 'left' },
  { name: 'name', label: t('common.name'), field: 'name', sortable: true, align: 'left' },
  { name: 'translation', label: t('common.translations'), field: 'translations', align: 'left' },
  { name: 'country_name', label: t('ad.country'), field: 'country_name', align: 'left' },
  { name: 'state', label: t('admin.province'), field: 'state_name', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
]);

interface Form {
  _id: string;
  id: number | null;
  name: string;
  country_id: number | null;
  country_code: string;
  country_name: string;
  state_id: number | null;
  state_code: string;
  state_name: string;
  translations: { uz: string; ru: string; en: string };
}

const form = reactive<Form>({
  _id: '', id: null, name: '', country_id: null, country_code: '', country_name: '',
  state_id: null, state_code: '', state_name: '', translations: { uz: '', ru: '', en: '' },
});

async function onCountryChange() {
  provinceId.value = null;
  provinceOptions.value = [];
  if (countryId.value) {
    try {
      const res = await apiGetProvincesByCountry(countryId.value);
      provinceOptions.value = res.data.data.map((p) => ({
        label: translatedName(p.translations, locale.value, p.name),
        value: p.id,
        name: p.name,
        state_code: p.state_code ?? '',
      }));
    } catch {
      // interceptor xabar beradi
    }
  }
  void loadCities();
}

async function loadCities() {
  if (!hasFilter.value) {
    cities.value = [];
    return;
  }
  loading.value = true;
  try {
    const res = await apiGetCities({
      name: search.value || undefined,
      country_id: countryId.value ?? undefined,
      state_id: provinceId.value ?? undefined,
    });
    cities.value = res.data.data;
  } catch {
    // interceptor xabar beradi
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  // Filtrda tanlangan mamlakat va viloyat avtomatik to'ldiriladi
  const c = selectedCountry.value;
  const p = selectedProvince.value;
  Object.assign(form, {
    _id: '', id: null, name: '',
    country_id: c?.value ?? null, country_code: c?.iso2 ?? '', country_name: c?.name ?? '',
    state_id: p?.value ?? null, state_code: p?.state_code ?? '', state_name: p?.name ?? '',
    translations: { uz: '', ru: '', en: '' },
  });
  error.value = '';
  dialog.value = true;
}

function openEdit(row: City) {
  Object.assign(form, {
    _id: row._id, id: row.id, name: row.name,
    country_id: row.country_id, country_code: row.country_code ?? '',
    country_name: row.country_name ?? '', state_id: row.state_id ?? null,
    state_code: row.state_code ?? '', state_name: row.state_name ?? '',
    translations: { uz: row.translations?.uz ?? '', ru: row.translations?.ru ?? '', en: row.translations?.en ?? '' },
  });
  error.value = '';
  dialog.value = true;
}

async function save() {
  error.value = '';
  saving.value = true;
  try {
    const payload = {
      name: form.name,
      country_id: form.country_id,
      country_code: form.country_code.toUpperCase(),
      country_name: form.country_name,
      state_id: form.state_id,
      state_code: form.state_code,
      state_name: form.state_name,
      // Bo'sh tarjima ('') backendda o'chirish deb qabul qilinadi
      translations: form.translations,
    };
    if (form._id) {
      const res = await apiAdminUpdateCity(form._id, payload);
      const idx = cities.value.findIndex((c) => c._id === form._id);
      if (idx >= 0) cities.value[idx] = res.data.data;
    } else {
      const res = await apiAdminCreateCity({ ...payload, id: form.id });
      cities.value.unshift(res.data.data);
    }
    dialog.value = false;
    $q.notify({ type: 'positive', message: t('common.saved') });
  } catch (err) {
    error.value = getErrorMessage(err, t('common.error'));
  } finally {
    saving.value = false;
  }
}

function confirmDelete(row: City) {
  deleteTarget.value = { name: row.name, _id: row._id };
  deleteDialog.value = true;
}

async function executeDelete() {
  const target = deleteTarget.value;
  if (!target) return;
  saving.value = true;
  try {
    await apiAdminDeleteCity(target._id);
    cities.value = cities.value.filter((c) => c._id !== target._id);
    deleteDialog.value = false;
    $q.notify({ type: 'positive', message: t('common.deleted') });
  } catch (err) {
    $q.notify({ type: 'negative', message: getErrorMessage(err, t('common.error')) });
  } finally {
    saving.value = false;
  }
}

onMounted(() => { void loadCountryOptions(); });
</script>
