<template>
  <div class="flex flex-col p-3 gap-3 max-w-[800px] mx-auto">
    <div class="text-lg font-bold">Yangi yuk e'loni</div>

    <!-- Yo'nalish -->
    <div class="flex gap-4">
      <q-radio v-model="form.direction" val="international" label="Xalqaro" />
      <q-radio v-model="form.direction" val="intercity" label="Shaharlararo" />
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
        @filter="(v, u) => searchLocation(v, u, 'from')"
        behavior="menu"
        :rules="[(v) => !!v || 'Majburiy maydon']"
      >
        <template #no-option>
          <q-item><q-item-section class="text-grey">Topilmadi</q-item-section></q-item>
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
        @filter="(v, u) => searchLocation(v, u, 'to')"
        behavior="menu"
        :rules="[(v) => !!v || 'Majburiy maydon']"
      >
        <template #no-option>
          <q-item><q-item-section class="text-grey">Topilmadi</q-item-section></q-item>
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
      <q-input filled v-model="form.descriptions" label="Yuk tavsifi" type="textarea" rows="2" class="sm:col-span-2" />

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
      <q-input
        filled
        v-model="form.phone"
        label="Telefon *"
        :rules="[(v) => !!v || 'Majburiy maydon']"
      />

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
import { ref, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { apiCreateAd, apiGetCountries, apiGetCities } from 'src/api';

const $q = useQuasar();

const TRUCK_TYPES = ['Tent', 'Ref', 'Plashchaniy', 'Konteyner', 'Bortovoy', 'Samosvал'];
const PAYMENT_TYPES = ['Naqd', "Pul o'tkazish"];
const CURRENCIES = ['UZS', 'USD', 'RUB'];

const loading = ref(false);
const errorMsg = ref('');
const fromOptions = ref<string[]>([]);
const toOptions = ref<string[]>([]);

const form = reactive({
  direction: 'intercity',
  fromAddress: '',
  toAddress: '',
  truckType: [] as string[],
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

async function searchLocation(val: string, update: (fn: () => void) => void, side: 'from' | 'to') {
  if (!val || val.length < 2) {
    update(() => {
      if (side === 'from') fromOptions.value = [];
      else toOptions.value = [];
    });
    return;
  }
  try {
    let names: string[] = [];
    if (form.direction === 'international') {
      const res = await apiGetCountries();
      names = res.data.data
        .filter((c) => c.name.toLowerCase().includes(val.toLowerCase()))
        .map((c) => c.name);
    } else {
      const res = await apiGetCities({ name: val });
      names = res.data.data.map((c) => c.name);
    }
    update(() => {
      if (side === 'from') fromOptions.value = names;
      else toOptions.value = names;
    });
  } catch {
    update(() => {});
  }
}

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
      loadName: form.loadName || undefined,
      descriptions: form.descriptions || undefined,
      paymentType: form.paymentType || undefined,
      advance: form.advance || undefined,
      deliveryCost: form.deliveryCost || undefined,
      currency: form.currency || undefined,
      volume: form.volume ?? undefined,
      weight: form.weight ?? undefined,
      loadingTime: form.loadingTime || undefined,
      phone: form.phone,
      clientName: form.clientName || undefined,
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
}
</script>
