<template>
  <div>
    <div class="flex justify-between items-center mb-3 gap-2 flex-wrap">
      <q-select v-model="countryId" dense outlined use-input input-debounce="400"
        placeholder="Mamlakat" :options="countryOptions" option-label="label"
        option-value="value" emit-value map-options clearable class="flex-1 max-w-[220px]"
        @filter="filterCountryOptions" @update:model-value="onCountryChange" behavior="menu">
        <template #no-option>
          <q-item><q-item-section class="text-grey">Topilmadi</q-item-section></q-item>
        </template>
      </q-select>
      <q-select v-model="provinceId" dense outlined :options="provinceOptions"
        option-label="label" option-value="value" emit-value map-options clearable
        placeholder="Viloyat" class="flex-1 max-w-[220px]"
        @update:model-value="loadCities" behavior="menu">
        <template #no-option>
          <q-item><q-item-section class="text-grey">Topilmadi</q-item-section></q-item>
        </template>
      </q-select>
      <q-input v-model="search" dense outlined placeholder="Qidirish..." debounce="400"
        class="flex-1 max-w-[200px]" @update:model-value="loadCities" clearable />
      <q-btn color="primary" icon="add" label="Qo'shish" @click="openCreate" />
    </div>

    <q-table :rows="cities" :columns="columns" row-key="_id" flat bordered
      :loading="loading" rows-per-page-label="Qator" no-data-label="Ma'lumot yo'q"
      :pagination="{ rowsPerPage: 15 }">
      <template #body-cell-index="{ rowIndex }">
        <q-td>{{ rowIndex + 1 }}</q-td>
      </template>
      <template #body-cell-actions="{ row }">
        <q-td class="text-right">
          <q-btn flat round dense icon="edit" color="primary" @click="openEdit(row)" />
          <q-btn flat round dense icon="delete" color="negative" @click="confirmDelete(row)" />
        </q-td>
      </template>
    </q-table>

    <!-- Dialog -->
    <q-dialog v-model="dialog" persistent>
      <q-card style="min-width: 420px">
        <q-bar class="bg-primary text-white">
          <span class="font-bold">{{ form._id ? 'Tahrirlash' : 'Yangi shahar' }}</span>
          <q-space />
          <q-btn flat dense icon="close" v-close-popup />
        </q-bar>
        <q-card-section class="flex flex-col gap-3">
          <q-input v-if="!form._id" v-model.number="form.id" label="ID *" dense filled type="number" />
          <q-input v-model="form.name" label="Nomi *" dense filled />
          <q-input v-model.number="form.country_id" label="Country ID *" dense filled type="number" />
          <q-input v-model="form.country_code" label="Country kodi (ISO2) *" dense filled />
          <q-input v-model="form.country_name" label="Mamlakat nomi *" dense filled />
          <q-input v-model.number="form.state_id" label="Viloyat ID" dense filled type="number" />
          <div class="text-sm font-bold mt-1">Tarjimalar</div>
          <div class="grid grid-cols-3 gap-2">
            <q-input v-model="form.translations.uz" label="UZ" dense filled />
            <q-input v-model="form.translations.ru" label="RU" dense filled />
            <q-input v-model="form.translations.en" label="EN" dense filled />
          </div>
          <div v-if="error" class="text-negative text-sm">{{ error }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Bekor" v-close-popup />
          <q-btn color="primary" label="Saqlash" :loading="saving" @click="save" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- O'chirish -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-base">Rostdan ham o'chirmoqchimisiz?</div>
          <div class="text-sm text-grey-7 mt-1">{{ deleteTarget?.name }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Bekor" v-close-popup />
          <q-btn color="negative" label="O'chirish" :loading="saving" @click="executeDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { apiGetCities, apiGetProvincesByCountry, apiAdminCreateCity, apiAdminUpdateCity, apiAdminDeleteCity } from 'src/api';
import { useAdminCountrySelect, getErrorMessage, type SelectOption } from 'src/composables/useAdminCountrySelect';
import type { City } from 'src/types';

const $q = useQuasar();
const { countryOptions, loadCountryOptions, filterCountryOptions } = useAdminCountrySelect();

const cities = ref<City[]>([]);
const loading = ref(false);
const countryId = ref<number | null>(null);
const provinceId = ref<number | null>(null);
const search = ref('');
const provinceOptions = ref<SelectOption[]>([]);
const dialog = ref(false);
const saving = ref(false);
const error = ref('');
const deleteDialog = ref(false);
const deleteTarget = ref<{ name: string; _id: string } | null>(null);

const columns = [
  { name: 'index', label: '#', field: 'index', align: 'left' as const },
  { name: 'id', label: 'ID', field: 'id', sortable: true, align: 'left' as const },
  { name: 'name', label: 'Nomi', field: 'name', sortable: true, align: 'left' as const },
  { name: 'country_name', label: 'Mamlakat', field: 'country_name', align: 'left' as const },
  { name: 'state_id', label: 'Viloyat ID', field: 'state_id', align: 'left' as const },
  { name: 'actions', label: '', field: 'actions', align: 'right' as const },
];

interface Form {
  _id: string; id: number | null; name: string;
  country_id: number | null; country_code: string; country_name: string;
  state_id: number | null;
  translations: { uz: string; ru: string; en: string };
}

const form = reactive<Form>({
  _id: '', id: null, name: '', country_id: null, country_code: '', country_name: '',
  state_id: null, translations: { uz: '', ru: '', en: '' },
});

async function onCountryChange() {
  provinceId.value = null;
  provinceOptions.value = [];
  if (countryId.value) {
    const res = await apiGetProvincesByCountry(countryId.value);
    provinceOptions.value = res.data.data.map((p) => ({
      label: p.translations?.uz ?? p.translations?.ru ?? p.name,
      value: p.id,
    }));
  }
  void loadCities();
}

async function loadCities() {
  if (!countryId.value && !provinceId.value && !search.value) { cities.value = []; return; }
  loading.value = true;
  try {
    const params: Parameters<typeof apiGetCities>[0] = {};
    if (search.value) params.name = search.value;
    if (countryId.value != null) params.country_id = countryId.value;
    if (provinceId.value != null) params.state_id = provinceId.value;
    const res = await apiGetCities(params);
    cities.value = res.data.data;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  Object.assign(form, { _id: '', id: null, name: '', country_id: countryId.value, country_code: '', country_name: '', state_id: provinceId.value, translations: { uz: '', ru: '', en: '' } });
  error.value = '';
  dialog.value = true;
}

function openEdit(row: City) {
  Object.assign(form, {
    _id: row._id, id: row.id, name: row.name,
    country_id: row.country_id, country_code: row.country_code ?? '',
    country_name: row.country_name ?? '', state_id: row.state_id ?? null,
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
      ...(form._id ? {} : { id: form.id }),
      name: form.name, country_id: form.country_id,
      country_code: form.country_code, country_name: form.country_name,
      state_id: form.state_id, translations: form.translations,
    };
    if (form._id) {
      const res = await apiAdminUpdateCity(form._id, payload);
      const idx = cities.value.findIndex((c) => c._id === form._id);
      if (idx >= 0) cities.value[idx] = res.data.data;
    } else {
      const res = await apiAdminCreateCity(payload);
      cities.value.unshift(res.data.data);
    }
    dialog.value = false;
    $q.notify({ type: 'positive', message: 'Saqlandi!' });
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
}

function confirmDelete(row: City) {
  deleteTarget.value = { name: row.name, _id: row._id };
  deleteDialog.value = true;
}

async function executeDelete() {
  if (!deleteTarget.value) return;
  saving.value = true;
  try {
    await apiAdminDeleteCity(deleteTarget.value._id);
    cities.value = cities.value.filter((c) => c._id !== deleteTarget.value!._id);
    deleteDialog.value = false;
    $q.notify({ type: 'positive', message: "O'chirildi!" });
  } catch (err) {
    $q.notify({ type: 'negative', message: getErrorMessage(err) });
  } finally {
    saving.value = false;
  }
}

onMounted(() => { void loadCountryOptions(); });
</script>
