<template>
  <div>
    <div class="flex justify-between items-center mb-3 gap-2">
      <q-input
        v-model="search"
        dense
        outlined
        clearable
        :placeholder="t('common.search')"
        debounce="400"
        class="flex-1 max-w-[300px]"
        @update:model-value="loadCountries"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <q-btn color="primary" icon="add" :label="t('common.add')" @click="openCreate" />
    </div>

    <q-table
      :rows="countries"
      :columns="columns"
      row-key="_id"
      flat
      bordered
      :loading="loading"
      :rows-per-page-label="t('common.rowsPerPage')"
      :no-data-label="t('common.noData')"
      :pagination="{ rowsPerPage: 15 }"
    >
      <template #body-cell-index="{ rowIndex }">
        <q-td>{{ rowIndex + 1 }}</q-td>
      </template>
      <template #body-cell-name="{ row }">
        <q-td>
          <div>{{ row.name }}</div>
          <div class="text-xs text-grey-6">{{ countryLabel(row, locale) }}</div>
        </q-td>
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
      <q-card style="min-width: 400px; max-width: 95vw">
        <q-form @submit.prevent="save">
          <q-bar class="bg-primary text-white">
            <span class="font-bold">{{ form._id ? t('common.edit') : t('admin.newCountry') }}</span>
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
            <q-input v-model="form.iso2" :label="t('admin.iso2')" dense filled maxlength="2" />
            <q-input v-model="form.iso3" :label="t('admin.iso3')" dense filled maxlength="3" />
            <q-input v-model="form.region" :label="t('admin.region')" dense filled />
            <q-input v-model="form.subregion" :label="t('admin.subregion')" dense filled />
            <q-input v-model="form.emoji" :label="t('admin.flagEmoji')" dense filled />
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
  apiGetCountries,
  apiGetCountry,
  apiAdminCreateCountry,
  apiAdminUpdateCountry,
  apiAdminDeleteCountry,
} from 'src/api';
import { getErrorMessage } from 'src/utils/error';
import { countryLabel } from 'src/utils/location';
import type { Country } from 'src/types';

const $q = useQuasar();
const { t, locale } = useI18n();

const countries = ref<Country[]>([]);
const loading = ref(false);
const search = ref<string | null>('');
const dialog = ref(false);
const saving = ref(false);
const error = ref('');
const deleteDialog = ref(false);
const deleteTarget = ref<{ name: string; id: number } | null>(null);

const columns = computed<QTableColumn[]>(() => [
  { name: 'index', label: '#', field: 'index', align: 'left' },
  { name: 'id', label: 'ID', field: 'id', sortable: true, align: 'left' },
  { name: 'emoji', label: '', field: 'emoji', align: 'left' },
  { name: 'name', label: t('common.name'), field: 'name', sortable: true, align: 'left' },
  { name: 'iso2', label: t('admin.iso2'), field: 'iso2', align: 'left' },
  { name: 'region', label: t('admin.region'), field: 'region', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
]);

interface Form {
  _id: string;
  id: number | null;
  name: string;
  iso2: string;
  iso3: string;
  region: string;
  subregion: string;
  emoji: string;
  translations: { uz: string; ru: string; en: string };
}

function emptyForm(): Form {
  return {
    _id: '', id: null, name: '', iso2: '', iso3: '', region: '', subregion: '', emoji: '',
    translations: { uz: '', ru: '', en: '' },
  };
}

const form = reactive<Form>(emptyForm());

async function loadCountries() {
  loading.value = true;
  try {
    const res = await apiGetCountries({ q: search.value || undefined, limit: 100 });
    countries.value = res.data.data;
  } catch {
    // interceptor xabar beradi
  } finally {
    loading.value = false;
  }
}

function fillForm(row: Country) {
  Object.assign(form, {
    _id: row._id, id: row.id, name: row.name, iso2: row.iso2 ?? '', iso3: row.iso3 ?? '',
    region: row.region ?? '', subregion: row.subregion ?? '', emoji: row.emoji ?? '',
    translations: {
      uz: row.translations?.['uz'] ?? '',
      ru: row.translations?.['ru'] ?? '',
      en: row.translations?.['en'] ?? '',
    },
  });
}

function openCreate() {
  Object.assign(form, emptyForm());
  error.value = '';
  dialog.value = true;
}

async function openEdit(row: Country) {
  // Ro'yxat qisqartirilgan maydonlarni qaytaradi — tahrirlash uchun to'liq hujjatni olamiz,
  // aks holda bo'sh maydonlar saqlashda eski qiymatlarni o'chirib yuboradi
  fillForm(row);
  error.value = '';
  dialog.value = true;
  try {
    const res = await apiGetCountry(row.id);
    if (form._id === row._id) fillForm(res.data.data);
  } catch {
    // ro'yxatdagi ma'lumot bilan davom etamiz
  }
}

async function save() {
  error.value = '';
  saving.value = true;
  try {
    const translations: Record<string, string> = {};
    for (const [k, v] of Object.entries(form.translations)) if (v) translations[k] = v;
    const payload = {
      name: form.name, iso2: form.iso2.toUpperCase(), iso3: form.iso3.toUpperCase(),
      region: form.region, subregion: form.subregion, emoji: form.emoji,
      translations,
    };
    if (form._id) {
      const res = await apiAdminUpdateCountry(form.id!, payload);
      const idx = countries.value.findIndex((c) => c._id === form._id);
      if (idx >= 0) countries.value[idx] = res.data.data;
    } else {
      const res = await apiAdminCreateCountry({ ...payload, id: form.id });
      countries.value.unshift(res.data.data);
    }
    dialog.value = false;
    $q.notify({ type: 'positive', message: t('common.saved') });
  } catch (err) {
    error.value = getErrorMessage(err, t('common.error'));
  } finally {
    saving.value = false;
  }
}

function confirmDelete(row: Country) {
  deleteTarget.value = { name: row.name, id: row.id };
  deleteDialog.value = true;
}

async function executeDelete() {
  const target = deleteTarget.value;
  if (!target) return;
  saving.value = true;
  try {
    await apiAdminDeleteCountry(target.id);
    countries.value = countries.value.filter((c) => c.id !== target.id);
    deleteDialog.value = false;
    $q.notify({ type: 'positive', message: t('common.deleted') });
  } catch (err) {
    $q.notify({ type: 'negative', message: getErrorMessage(err, t('common.error')) });
  } finally {
    saving.value = false;
  }
}

onMounted(() => { void loadCountries(); });
</script>
