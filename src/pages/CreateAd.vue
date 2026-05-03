<template>
  <div class="flex flex-col p-3 gap-3 max-w-[800px] mx-auto">
    <div class="text-lg font-bold">Yangi yuk e'loni</div>

    <!-- Yo'nalish -->
    <div class="flex gap-4">
      <q-radio v-model="form.direction" val="international" label="Xalqaro" @update:model-value="onDirectionChange" />
      <q-radio v-model="form.direction" val="intercity" label="Shaharlararo" @update:model-value="onDirectionChange" />
    </div>

    <section class="grid sm:grid-cols-2 gap-3">
      <!-- Qayerdan -->
      <q-select
        filled
        v-model="form.fromAddress"
        use-input
        clearable
        input-debounce="400"
        label="Qayerdan *"
        :options="fromOptions"
        option-label="label"
        option-value="value"
        emit-value
        map-options
        @filter="filterFrom"
        behavior="menu"
      >
        <template #option="{ itemProps, opt }">
          <q-item v-bind="itemProps">
            <q-item-section avatar>
              <q-icon
                :name="opt.type === 'province' ? 'map' : 'location_city'"
                :color="opt.type === 'province' ? 'teal' : 'orange'"
                size="18px"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ opt.label }}</q-item-label>
              <q-item-label caption class="text-grey-6">{{ opt.breadcrumb }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <template #no-option>
          <q-item><q-item-section class="text-grey">Qidirish uchun matn kiriting</q-item-section></q-item>
        </template>
      </q-select>

      <!-- Qayerga -->
      <q-select
        filled
        v-model="form.toAddress"
        use-input
        clearable
        input-debounce="400"
        label="Qayerga *"
        :options="toOptions"
        option-label="label"
        option-value="value"
        emit-value
        map-options
        @filter="filterTo"
        behavior="menu"
      >
        <template #option="{ itemProps, opt }">
          <q-item v-bind="itemProps">
            <q-item-section avatar>
              <q-icon
                :name="opt.type === 'province' ? 'map' : 'location_city'"
                :color="opt.type === 'province' ? 'teal' : 'orange'"
                size="18px"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ opt.label }}</q-item-label>
              <q-item-label caption class="text-grey-6">{{ opt.breadcrumb }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <template #no-option>
          <q-item><q-item-section class="text-grey">Qidirish uchun matn kiriting</q-item-section></q-item>
        </template>
      </q-select>

      <!-- Mashina turi -->
      <q-select
        filled
        v-model="form.truckType"
        clearable
        multiple
        use-chips
        label="Mashina turi"
        :options="TRUCK_TYPES"
        behavior="menu"
      >
        <template #option="{ itemProps, opt, selected, toggleOption }">
          <q-item v-bind="itemProps">
            <q-item-section>{{ opt }}</q-item-section>
            <q-item-section side>
              <q-toggle :model-value="selected" @update:model-value="toggleOption(opt)" />
            </q-item-section>
          </q-item>
        </template>
      </q-select>

      <!-- Yuk nomi -->
      <q-input filled v-model="form.loadName" label="Yuk nomi" />

      <!-- Yuk tavsifi -->
      <q-input
        filled
        v-model="form.descriptions"
        label="Yuk tavsifi"
        type="textarea"
        rows="2"
        class="sm:col-span-2"
      />

      <!-- To'lov turi -->
      <q-select
        filled
        v-model="form.paymentType"
        label="To'lov turi"
        :options="PAYMENT_TYPES"
        behavior="menu"
      />

      <!-- Avans + Narx + Valyuta -->
      <div class="flex gap-2">
        <q-input class="flex-1" filled v-model="form.advance" label="Avans" type="number" />
        <q-input class="flex-1" filled v-model="form.deliveryCost" label="Narxi" type="number" />
        <q-select
          filled
          v-model="form.currency"
          :options="CURRENCIES"
          behavior="menu"
          style="min-width: 80px"
        />
      </div>

      <!-- Hajm va vazn -->
      <q-input filled v-model.number="form.volume" label="Yuk hajmi (m³)" type="number" />
      <q-input filled v-model.number="form.weight" label="Yuk vazni (tonna)" type="number" />

      <!-- Yuklash vaqti -->
      <q-input filled v-model="form.loadingTime" label="Yuklash vaqti" type="date" />

      <!-- Telefon -->
      <q-input filled v-model="form.phone" label="Telefon *" />

      <!-- Mijoz ismi -->
      <q-input filled v-model="form.clientName" label="Murojaat uchun (ism)" />
    </section>

    <div v-if="errorMsg" class="text-negative text-sm">{{ errorMsg }}</div>

    <div class="flex justify-end gap-2">
      <q-btn flat label="Tozalash" @click="resetForm" />
      <q-btn color="primary" label="E'lon qo'shish" :loading="loading" @click="submitAd" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { apiCreateAd } from 'src/api';
import { useLocationSearch } from 'src/composables/useLocationSearch';

const $q = useQuasar();

const TRUCK_TYPES = ['Tent', 'Ref', 'Plashchaniy', 'Konteyner', 'Bortovoy', 'Samosvал'];
const PAYMENT_TYPES = ['Naqd', "Pul o'tkazish"];
const CURRENCIES = ['UZS', 'USD', 'RUB'];

const loading = ref(false);
const errorMsg = ref('');

interface AdForm {
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
const form = reactive<AdForm>({
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

const { fromOptions, toOptions, loadInitial, filterFrom, filterTo, clearOptions } = useLocationSearch(
  () => form.direction,
);

function onDirectionChange() {
  form.fromAddress = '';
  form.toAddress = '';
  void loadInitial();
}

onMounted(() => {
  void loadInitial();
});

async function submitAd() {
  errorMsg.value = '';
  if (!form.direction) { errorMsg.value = 'Yo\'nalish tanlang'; return; }
  if (!form.fromAddress) { errorMsg.value = '"Qayerdan" maydoni to\'ldirilishi shart'; return; }
  if (!form.toAddress) { errorMsg.value = '"Qayerga" maydoni to\'ldirilishi shart'; return; }
  if (!form.phone) { errorMsg.value = 'Telefon raqam kiritilishi shart'; return; }

  loading.value = true;
  try {
    await apiCreateAd({
      direction: form.direction,
      fromAddress: form.fromAddress,
      toAddress: form.toAddress,
      truckType: form.truckType,
      ...(form.loadName && { loadName: form.loadName }),
      ...(form.descriptions && { descriptions: form.descriptions }),
      ...(form.paymentType && { paymentType: form.paymentType }),
      ...(form.advance && { advance: form.advance }),
      ...(form.deliveryCost && { deliveryCost: form.deliveryCost }),
      ...(form.currency && { currency: form.currency }),
      ...(form.volume !== null && { volume: form.volume }),
      ...(form.weight !== null && { weight: form.weight }),
      ...(form.loadingTime && { loadingTime: form.loadingTime }),
      phone: form.phone,
      ...(form.clientName && { clientName: form.clientName }),
    });
    $q.notify({ type: 'positive', message: 'E\'lon muvaffaqiyatli qo\'shildi!' });
    resetForm();
  } catch {
    errorMsg.value = 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.';
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.direction = 'intercity';
  form.fromAddress = '';
  form.toAddress = '';
  form.truckType = [];
  form.loadName = '';
  form.descriptions = '';
  form.paymentType = '';
  form.advance = '';
  form.deliveryCost = '';
  form.currency = 'UZS';
  form.volume = null;
  form.weight = null;
  form.loadingTime = '';
  form.phone = '';
  form.clientName = '';
  clearOptions();
}
</script>
