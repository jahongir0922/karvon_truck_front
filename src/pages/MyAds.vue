<template>
  <div class="p-3">
    <div class="flex items-center justify-between mb-4">
      <div class="text-lg font-bold">E'lonlarni boshqarish</div>
      <q-btn v-if="auth.isAdmin" color="primary" dense label="Yangilash" icon="refresh" @click="loadAds" />
    </div>

    <!-- Admin panel -->
    <template v-if="auth.isAdmin">
      <div v-if="loading" class="text-center py-10 text-grey-6">Yuklanmoqda...</div>

      <div v-else-if="!ads.length" class="text-center py-10 text-grey-6">
        Hozircha e'lonlar yo'q
      </div>

      <div v-else class="flex flex-col gap-3">
        <q-card v-for="ad in ads" :key="ad._id" class="p-3">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="font-bold text-primary">
                {{ ad.fromAddress }} → {{ ad.toAddress }}
              </div>
              <div class="text-sm text-grey-7">
                {{ ad.direction === 'international' ? 'Xalqaro' : 'Shaharlararo' }} ·
                {{ ad.truckType?.join(', ') }}
              </div>
              <div v-if="ad.phone" class="text-sm mt-1">
                <q-icon name="phone" size="14px" /> {{ ad.phone }}
              </div>
              <div class="text-xs text-grey-5 mt-1">{{ formatDate(ad.createdAt) }}</div>
            </div>
            <div class="flex gap-1 flex-shrink-0">
              <q-badge :color="ad.isActive ? 'positive' : 'grey'">
                {{ ad.isActive ? 'Faol' : 'Nofaol' }}
              </q-badge>
              <q-badge v-if="ad.isAI" color="purple">AI</q-badge>
            </div>
          </div>

          <q-separator class="my-2" />

          <div class="flex gap-2 justify-end">
            <q-btn
              flat
              dense
              size="sm"
              :icon="ad.isActive ? 'visibility_off' : 'visibility'"
              :label="ad.isActive ? 'O\'chirish' : 'Yoqish'"
              :color="ad.isActive ? 'negative' : 'positive'"
              @click="toggleActive(ad)"
            />
            <q-btn
              flat
              dense
              size="sm"
              icon="edit"
              label="Tahrirlash"
              color="primary"
              @click="openEditDialog(ad)"
            />
          </div>
        </q-card>
      </div>
    </template>

    <!-- Non-admin view -->
    <template v-else>
      <div class="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <q-icon name="lock" size="60px" color="grey-5" />
        <div class="text-grey-7">Bu bo'lim faqat administratorlar uchun</div>
        <q-btn color="primary" label="Yuk e'lon qilish" to="/create-ads" />
      </div>
    </template>

    <!-- Edit dialog -->
    <q-dialog v-model="editDialog" persistent>
      <q-card style="min-width: 350px; max-width: 600px; width: 100%">
        <q-card-section class="flex items-center justify-between">
          <div class="font-bold text-lg">E'lonni tahrirlash</div>
          <q-btn flat dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section v-if="editForm" class="flex flex-col gap-3">
          <div class="grid sm:grid-cols-2 gap-3">
            <q-input filled v-model="editForm.fromAddress" label="Qayerdan" />
            <q-input filled v-model="editForm.toAddress" label="Qayerga" />
            <q-input filled v-model="editForm.loadName" label="Yuk nomi" />
            <q-input filled v-model.number="editForm.weight" label="Vazn (tonna)" type="number" />
            <q-input filled v-model.number="editForm.volume" label="Hajm (m³)" type="number" />
            <q-input filled v-model="editForm.paymentType" label="To'lov turi" />
            <q-input filled v-model="editForm.advance" label="Avans" />
            <q-input filled v-model="editForm.deliveryCost" label="Narxi" />
            <q-input filled v-model="editForm.currency" label="Valyuta" />
            <q-input filled v-model="editForm.phone" label="Telefon" />
            <q-input filled v-model="editForm.descriptions" label="Tavsif" type="textarea" class="sm:col-span-2" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Bekor" v-close-popup />
          <q-btn color="primary" label="Saqlash" :loading="saveLoading" @click="saveEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';
import { apiGetAds, apiUpdateAd } from 'src/api';
import type { Advertisement } from 'src/types';

const $q = useQuasar();
const auth = useAuthStore();

const ads = ref<Advertisement[]>([]);
const loading = ref(false);
const editDialog = ref(false);
const saveLoading = ref(false);
const editForm = ref<Partial<Advertisement> & { _id?: string } | null>(null);

async function loadAds() {
  if (!auth.isAdmin) return;
  loading.value = true;
  try {
    const res = await apiGetAds({ page: 1, perPage: 200 });
    ads.value = res.data.data;
  } finally {
    loading.value = false;
  }
}

async function toggleActive(ad: Advertisement) {
  try {
    const res = await apiUpdateAd(ad._id, { isActive: !ad.isActive });
    const updated = res.data.data;
    const idx = ads.value.findIndex((a) => a._id === ad._id);
    if (idx >= 0) ads.value.splice(idx, 1, updated);
    $q.notify({ type: 'positive', message: updated.isActive ? 'E\'lon yoqildi' : 'E\'lon o\'chirildi' });
  } catch {
    $q.notify({ type: 'negative', message: 'Xatolik yuz berdi' });
  }
}

function openEditDialog(ad: Advertisement) {
  editForm.value = { ...ad };
  editDialog.value = true;
}

async function saveEdit() {
  if (!editForm.value?._id) return;
  saveLoading.value = true;
  const payload: Record<string, unknown> = {};
  if (editForm.value.fromAddress !== undefined) payload.fromAddress = editForm.value.fromAddress;
  if (editForm.value.toAddress !== undefined) payload.toAddress = editForm.value.toAddress;
  if (editForm.value.loadName !== undefined) payload.loadName = editForm.value.loadName;
  if (editForm.value.weight !== undefined) payload.weight = editForm.value.weight;
  if (editForm.value.volume !== undefined) payload.volume = editForm.value.volume;
  if (editForm.value.paymentType !== undefined) payload.paymentType = editForm.value.paymentType;
  if (editForm.value.advance !== undefined) payload.advance = String(editForm.value.advance);
  if (editForm.value.deliveryCost !== undefined) payload.deliveryCost = String(editForm.value.deliveryCost);
  if (editForm.value.currency !== undefined) payload.currency = editForm.value.currency;
  if (editForm.value.phone !== undefined) payload.phone = editForm.value.phone;
  if (editForm.value.descriptions !== undefined) payload.descriptions = editForm.value.descriptions;
  try {
    const res = await apiUpdateAd(editForm.value._id, payload);
    const updated = res.data.data;
    const idx = ads.value.findIndex((a) => a._id === updated._id);
    if (idx >= 0) ads.value.splice(idx, 1, updated);
    $q.notify({ type: 'positive', message: 'E\'lon yangilandi' });
    editDialog.value = false;
  } catch {
    $q.notify({ type: 'negative', message: 'Saqlashda xatolik' });
  } finally {
    saveLoading.value = false;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('uz-UZ', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

onMounted(() => {
  void loadAds();
});
</script>
