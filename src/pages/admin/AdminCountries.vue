<template>
  <div>
    <div class="flex justify-between items-center mb-3 gap-2">
      <q-input v-model="search" dense outlined placeholder="Qidirish..." debounce="400"
        class="flex-1 max-w-[300px]" @update:model-value="loadCountries" clearable />
      <q-btn color="primary" icon="add" label="Qo'shish" @click="openCreate" />
    </div>

    <q-table :rows="countries" :columns="columns" row-key="_id" flat bordered
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
      <q-card style="min-width: 400px">
        <q-bar class="bg-primary text-white">
          <span class="font-bold">{{ form._id ? 'Tahrirlash' : 'Yangi mamlakat' }}</span>
          <q-space />
          <q-btn flat dense icon="close" v-close-popup />
        </q-bar>
        <q-card-section class="flex flex-col gap-3">
          <q-input v-if="!form._id" v-model.number="form.id" label="ID *" dense filled type="number" />
          <q-input v-model="form.name" label="Nomi *" dense filled />
          <q-input v-model="form.iso2" label="ISO2" dense filled maxlength="2" />
          <q-input v-model="form.iso3" label="ISO3" dense filled maxlength="3" />
          <q-input v-model="form.region" label="Region" dense filled />
          <q-input v-model="form.subregion" label="Subregion" dense filled />
          <q-input v-model="form.emoji" label="Bayroq emoji" dense filled />
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
import { apiGetCountries, apiAdminCreateCountry, apiAdminUpdateCountry, apiAdminDeleteCountry } from 'src/api';
import { getErrorMessage } from 'src/composables/useAdminCountrySelect';
import type { Country } from 'src/types';

const $q = useQuasar();

const countries = ref<Country[]>([]);
const loading = ref(false);
const search = ref('');
const dialog = ref(false);
const saving = ref(false);
const error = ref('');
const deleteDialog = ref(false);
const deleteTarget = ref<{ name: string; id: number } | null>(null);

const columns = [
  { name: 'index', label: '#', field: 'index', align: 'left' as const },
  { name: 'id', label: 'ID', field: 'id', sortable: true, align: 'left' as const },
  { name: 'emoji', label: '', field: 'emoji', align: 'left' as const },
  { name: 'name', label: 'Nomi', field: 'name', sortable: true, align: 'left' as const },
  { name: 'iso2', label: 'ISO2', field: 'iso2', align: 'left' as const },
  { name: 'region', label: 'Region', field: 'region', align: 'left' as const },
  { name: 'actions', label: '', field: 'actions', align: 'right' as const },
];

interface Form {
  _id: string; id: number | null; name: string; iso2: string; iso3: string;
  region: string; subregion: string; emoji: string;
  translations: { uz: string; ru: string; en: string };
}

const form = reactive<Form>({
  _id: '', id: null, name: '', iso2: '', iso3: '', region: '', subregion: '', emoji: '',
  translations: { uz: '', ru: '', en: '' },
});

async function loadCountries() {
  loading.value = true;
  try {
    const params: Parameters<typeof apiGetCountries>[0] = { limit: 50 };
    if (search.value) params.q = search.value;
    const res = await apiGetCountries(params);
    countries.value = res.data.data;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  Object.assign(form, { _id: '', id: null, name: '', iso2: '', iso3: '', region: '', subregion: '', emoji: '', translations: { uz: '', ru: '', en: '' } });
  error.value = '';
  dialog.value = true;
}

function openEdit(row: Country) {
  Object.assign(form, {
    _id: row._id, id: row.id, name: row.name, iso2: row.iso2 ?? '', iso3: row.iso3 ?? '',
    region: row.region ?? '', subregion: row.subregion ?? '', emoji: row.emoji ?? '',
    translations: { uz: row.translations?.['uz'] ?? '', ru: row.translations?.['ru'] ?? '', en: row.translations?.['en'] ?? '' },
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
      name: form.name, iso2: form.iso2, iso3: form.iso3,
      region: form.region, subregion: form.subregion, emoji: form.emoji,
      translations: form.translations,
    };
    if (form._id) {
      const res = await apiAdminUpdateCountry(form.id!, payload);
      const idx = countries.value.findIndex((c) => c._id === form._id);
      if (idx >= 0) countries.value[idx] = res.data.data;
    } else {
      const res = await apiAdminCreateCountry(payload);
      countries.value.unshift(res.data.data);
    }
    dialog.value = false;
    $q.notify({ type: 'positive', message: 'Saqlandi!' });
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
}

function confirmDelete(row: Country) {
  deleteTarget.value = { name: row.name, id: row.id };
  deleteDialog.value = true;
}

async function executeDelete() {
  if (!deleteTarget.value) return;
  saving.value = true;
  try {
    await apiAdminDeleteCountry(deleteTarget.value.id);
    countries.value = countries.value.filter((c) => c.id !== deleteTarget.value!.id);
    deleteDialog.value = false;
    $q.notify({ type: 'positive', message: "O'chirildi!" });
  } catch (err) {
    $q.notify({ type: 'negative', message: getErrorMessage(err) });
  } finally {
    saving.value = false;
  }
}

onMounted(() => { void loadCountries(); });
</script>
