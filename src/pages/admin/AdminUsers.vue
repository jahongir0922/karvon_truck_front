<template>
  <div>
    <div class="flex justify-between items-center mb-3 gap-2">
      <q-input
        v-model="search"
        dense
        outlined
        clearable
        :placeholder="t('common.search')"
        class="flex-1 max-w-[300px]"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <q-btn flat dense round icon="refresh" :loading="loading" :aria-label="t('common.refresh')" @click="loadUsers" />
    </div>

    <q-table
      :rows="users"
      :columns="columns"
      row-key="_id"
      flat
      bordered
      :loading="loading"
      :filter="search ?? ''"
      :rows-per-page-label="t('common.rowsPerPage')"
      :no-data-label="t('admin.noUsers')"
      :pagination="{ rowsPerPage: 15, sortBy: 'createdAt', descending: true }"
    >
      <template #body-cell-isAdmin="{ row }">
        <q-td>
          <q-badge :color="row.isAdmin ? 'primary' : 'grey'">
            {{ row.isAdmin ? t('admin.roleAdmin') : t('admin.roleUser') }}
          </q-badge>
        </q-td>
      </template>
      <template #body-cell-createdAt="{ row }">
        <q-td>{{ formatDateTime(row.createdAt, locale) }}</q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { type QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import { apiGetUsers } from 'src/api';
import { formatDateTime } from 'src/utils/format';
import type { User } from 'src/types';

const { t, locale } = useI18n();

const users = ref<User[]>([]);
const loading = ref(false);
const search = ref<string | null>('');

const columns = computed<QTableColumn[]>(() => [
  { name: 'name', label: t('auth.name'), field: 'name', sortable: true, align: 'left' },
  { name: 'email', label: t('admin.email'), field: 'email', sortable: true, align: 'left' },
  { name: 'isAdmin', label: t('admin.role'), field: 'isAdmin', sortable: true, align: 'left' },
  { name: 'createdAt', label: t('admin.registeredAt'), field: 'createdAt', sortable: true, align: 'left' },
]);

async function loadUsers() {
  loading.value = true;
  try {
    const res = await apiGetUsers();
    users.value = res.data.data;
  } catch {
    // interceptor xabar beradi
  } finally {
    loading.value = false;
  }
}

onMounted(() => { void loadUsers(); });
</script>
