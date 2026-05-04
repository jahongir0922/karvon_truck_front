<template>
  <q-page class="p-3 max-w-[900px] mx-auto">
    <div class="text-lg font-bold mb-4">Mening e'lonlarim</div>

    <div v-if="loading" class="text-center py-10">
      <q-spinner size="40px" color="primary" />
    </div>

    <div v-else-if="!ads.length" class="text-center text-grey-6 py-10">
      Hozircha e'lonlar yo'q
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
              {{ ad.isActive ? 'Faol' : 'Nofaol' }}
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
          <span class="font-bold">E'lonni tahrirlash</span>
          <q-space />
          <q-btn flat dense icon="close" v-close-popup />
        </q-bar>

        <q-scroll-area class="flex-1">
          <q-form ref="editFormRef" class="flex flex-col p-4 gap-3 max-w-[800px] mx-auto" @submit.prevent="saveEdit">

            <div class="flex gap-4">
              <q-radio v-model="editForm.direction" val="international" label="Xalqaro" />
              <q-radio v-model="editForm.direction" val="intercity" label="Shaharlararo" />
            </div>

            <section class="grid sm:grid-cols-2 gap-3">
              <q-input filled v-model="editForm.fromAddress" label="Qayerdan *"
                :rules="[(v) => !!v || 'Majburiy maydon']" lazy-rules />
              <q-input filled v-model="editForm.toAddress" label="Qayerga *"
                :rules="[(v) => !!v || 'Majburiy maydon']" lazy-rules />

              <q-select filled v-model="editForm.truckType" multiple use-chips clearable
                label="Mashina turi" :options="TRUCK_TYPES" behavior="menu">
                <template #option="{ itemProps, opt, selected, toggleOption }">
                  <q-item v-bind="itemProps">
                    <q-item-section>{{ opt }}</q-item-section>
                    <q-item-section side>
                      <q-toggle :model-value="selected" @update:model-value="toggleOption(opt)" />
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <q-input filled v-model="editForm.loadName" label="Yuk nomi"
                :rules="[(v) => !v || v.length >= 2 || 'Kamida 2 ta belgi']" lazy-rules />

              <q-input filled v-model="editForm.descriptions" label="Yuk tavsifi"
                type="textarea" rows="2" class="sm:col-span-2"
                :rules="[(v) => !v || v.length <= 500 || 'Ko\'pi bilan 500 ta belgi']" lazy-rules />

              <q-select filled v-model="editForm.paymentType" label="To'lov turi"
                clearable :options="PAYMENT_TYPES" behavior="menu" />

              <div class="flex gap-2 items-start">
                <q-input class="flex-1" filled v-model="editForm.advance" label="Avans"
                  :rules="[(v) => !v || /^\d{1,16}(\.\d{1,4})?$/.test(v) || 'Faqat raqam']" lazy-rules />
                <q-input class="flex-1" filled v-model="editForm.deliveryCost" label="Narxi"
                  :rules="[(v) => !v || /^\d{1,16}(\.\d{1,4})?$/.test(v) || 'Faqat raqam']" lazy-rules />
                <q-select filled v-model="editForm.currency" :options="CURRENCIES"
                  behavior="menu" style="min-width: 80px" />
              </div>

              <q-input filled v-model.number="editForm.volume" label="Yuk hajmi (m³)" type="number"
                :rules="[(v) => v === null || v === '' || v >= 2 || 'Kamida 2 m³']" lazy-rules />
              <q-input filled v-model.number="editForm.weight" label="Yuk vazni (tonna)" type="number"
                :rules="[(v) => v === null || v === '' || v >= 2 || 'Kamida 2 tonna']" lazy-rules />

              <q-input filled v-model="editForm.loadingTime" label="Yuklash vaqti" type="date" />

              <q-input filled v-model="editForm.phone" label="Telefon *"
                :rules="[(v) => !!v || 'Majburiy maydon', (v) => !v || v.length >= 5 || 'Kamida 5 ta belgi']"
                lazy-rules />

              <q-input filled v-model="editForm.clientName" label="Murojaat uchun (ism)"
                :rules="[(v) => !v || v.length >= 2 || 'Kamida 2 ta belgi']" lazy-rules />
            </section>

            <div v-if="editError" class="text-negative text-sm">{{ editError }}</div>

            <div class="flex justify-end gap-2">
              <q-btn flat label="Bekor" v-close-popup />
              <q-btn color="primary" label="Saqlash" :loading="saving" type="submit" />
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
import { apiGetMyAds, apiUpdateAd } from 'src/api';
import type { Advertisement } from 'src/types';

const $q = useQuasar();

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

interface EditForm {
  direction: 'international' | 'intercity';
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
  volume: null as number | null,
  weight: null as number | null,
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
  editError.value = '';
  editDialog.value = true;
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
    $q.notify({ type: 'positive', message: "E'lon yangilandi!" });
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
    editError.value = Array.isArray(msg) ? msg.join(', ') : typeof msg === 'string' ? msg : "Xatolik yuz berdi.";
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
