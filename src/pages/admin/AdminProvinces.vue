<template>
  <div>
    <div class="flex justify-between items-center mb-3 gap-2 flex-wrap">
      <q-select v-model="countryId" dense outlined use-input input-debounce="400"
        :placeholder="t('admin.selectCountry')" :options="countryOptions" option-label="label"
        option-value="value" emit-value map-options clearable class="flex-1 max-w-[280px]"
        @filter="filterCountryOptions" @update:model-value="loadProvinces" behavior="menu">
        <template #no-option>
          <q-item><q-item-section class="text-grey">{{ t('common.notFound') }}</q-item-section></q-item>
        </template>
      </q-select>
      <q-btn color="primary" icon="add" :label="t('common.add')" @click="openCreate" />
    </div>

    <q-table :rows="provinces" :columns="columns" row-key="_id" flat bordered
      :loading="loading" :rows-per-page-label="t('common.rowsPerPage')" :no-data-label="t('common.noData')"
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
          <span class="font-bold">{{ form._id ? t('common.edit') : t('admin.newProvince') }}</span>
          <q-space />
          <q-btn flat dense icon="close" v-close-popup />
        </q-bar>
        <q-card-section class="flex flex-col gap-3">
          <q-input v-if="!form._id" v-model.number="form.id" :label="t('admin.id')" dense filled type="number" />
          <q-input v-model="form.name" :label="t('admin.nameRequired')" dense filled />
          <q-input v-model.number="form.country_id" :label="t('admin.countryIdRequired')" dense filled type="number" />
          <q-input v-model="form.country_code" :label="t('admin.countryCodeRequired')" dense filled />
          <q-input v-model="form.country_name" :label="t('admin.countryNameRequired')" dense filled />
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
          <q-btn flat :label="t('common.cancel')" v-close-popup />
          <q-btn color="primary" :label="t('common.save')" :loading="saving" @click="save" />
        </q-card-actions>
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
          <q-btn flat :label="t('common.cancel')" v-close-popup />
          <q-btn color="negative" :label="t('common.delete')" :loading="saving" @click="executeDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { apiGetProvincesByCountry, apiAdminCreateProvince, apiAdminUpdateProvince, apiAdminDeleteProvince } from 'src/api';
import { useAdminCountrySelect, getErrorMessage } from 'src/composables/useAdminCountrySelect';
import type { Province } from 'src/types';

const $q = useQuasar();
const { t } = useI18n();
const { countryOptions, loadCountryOptions, filterCountryOptions } = useAdminCountrySelect();

const provinces = ref<Province[]>([]);
const loading = ref(false);
const countryId = ref<number | null>(null);
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
  { name: 'state_code', label: 'Kod', field: 'state_code', align: 'left' as const },
  { name: 'actions', label: '', field: 'actions', align: 'right' as const },
];

interface Form {
  _id: string; id: number | null; name: string;
  country_id: number | null; country_code: string; country_name: string; state_code: string;
  translations: { uz: string; ru: string; en: string };
}

const form = reactive<Form>({
  _id: '', id: null, name: '', country_id: null, country_code: '', country_name: '', state_code: '',
  translations: { uz: '', ru: '', en: '' },
});

async function loadProvinces() {
  if (!countryId.value) { provinces.value = []; return; }
  loading.value = true;
  try {
    const res = await apiGetProvincesByCountry(countryId.value);
    provinces.value = res.data.data;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  Object.assign(form, { _id: '', id: null, name: '', country_id: countryId.value, country_code: '', country_name: '', state_code: '', translations: { uz: '', ru: '', en: '' } });
  error.value = '';
  dialog.value = true;
}

function openEdit(row: Province) {
  Object.assign(form, {
    _id: row._id, id: row.id, name: row.name, country_id: row.country_id,
    country_code: row.country_code ?? '', country_name: row.country_name ?? '',
    state_code: row.state_code ?? '',
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
      state_code: form.state_code, translations: form.translations,
    };
    if (form._id) {
      const res = await apiAdminUpdateProvince(form._id, payload);
      const idx = provinces.value.findIndex((p) => p._id === form._id);
      if (idx >= 0) provinces.value[idx] = res.data.data;
    } else {
      const res = await apiAdminCreateProvince(payload);
      provinces.value.unshift(res.data.data);
    }
    dialog.value = false;
    $q.notify({ type: 'positive', message: t('common.saved') });
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
}

function confirmDelete(row: Province) {
  deleteTarget.value = { name: row.name, _id: row._id };
  deleteDialog.value = true;
}

async function executeDelete() {
  if (!deleteTarget.value) return;
  saving.value = true;
  try {
    await apiAdminDeleteProvince(deleteTarget.value._id);
    provinces.value = provinces.value.filter((p) => p._id !== deleteTarget.value!._id);
    deleteDialog.value = false;
    $q.notify({ type: 'positive', message: t('common.deleted') });
  } catch (err) {
    $q.notify({ type: 'negative', message: getErrorMessage(err) });
  } finally {
    saving.value = false;
  }
}

onMounted(() => { void loadCountryOptions(); });
</script>
