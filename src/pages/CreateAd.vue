<template>
  <div class="flex flex-col p-2 gap-2">
    <div class="flex gap-4">
      <q-radio
        class="text-[18px]"
        name="direction"
        v-model="direction"
        val="international"
        label="Xalqaro"
      />
      <q-radio
        class="text-[18px]"
        name="direction"
        v-model="direction"
        val="intercity"
        label="Shaharlararo"
      />
    </div>
    <section class="grid sm:grid-cols-2 gap-2">
      <q-select
        filled
        v-model="fromAddress"
        use-input
        input-debounce="0"
        label="Qayerdan"
        :options="addresOptions"
        @filter="filterFn"
        behavior="menu"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey"> No results </q-item-section>
          </q-item>
        </template>
      </q-select>
      <q-select
        filled
        v-model="toAddress"
        use-input
        input-debounce="0"
        label="Qayerga"
        :options="addresOptions"
        @filter="filterFn"
        behavior="menu"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey"> No results </q-item-section>
          </q-item>
        </template>
      </q-select>
      <q-select
        filled
        v-model="truckType"
        clearable
        multiple
        use-chips
        input-debounce="0"
        label="Mashina turi"
        :options="truckTypeOptions"
        behavior="menu"
      >
        <template v-slot:option="{ itemProps, opt, selected, toggleOption }">
          <q-item v-bind="itemProps">
            <q-item-section>
              {{ opt }}
            </q-item-section>
            <q-item-section side>
              <q-toggle :model-value="selected" @update:model-value="toggleOption(opt)" />
            </q-item-section>
          </q-item>
        </template>
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey"> No results </q-item-section>
          </q-item>
        </template>
      </q-select>
      <q-input filled v-model="loadName" label="Yuk nomi" />
      <q-input filled v-model="descriptions" label="Yuk tavsifi" />
      <q-select
        filled
        v-model="paymentType"
        input-debounce="0"
        label="Tolov turi"
        :options="paymentTypeOptions"
        behavior="menu"
      >
      </q-select>
      <div class="q-input flex flex-nowrap gap-1 w-full">
        <q-input class="w-full" filled v-model="advance" label="Avans" />
        <q-input class="w-full" filled v-model="price" label="Narxi" />
        <q-select
          filled
          v-model="currency"
          input-debounce="0"
          :options="currencyOptions"
          behavior="menu"
        >
        </q-select>
      </div>
      <q-input filled v-model="volume" label="Yuk hajmi (m³)" />
      <q-input filled v-model="weight" label="Yuk vazni (tonna)" />
      <q-input filled type="date" v-model="loadingTime" label="Yuklash vaqti" />
      <q-input filled v-model="phone" label="Bog'lanish" />
      <q-input filled v-model="clientName" label="Murojaat uchun" />
    </section>
    <div class="flex justify-end">
      <q-btn color="primary" label="Qo'shish" @click="addLoad()" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

const addreses = ['Fargona', 'Namangan', 'Andijon', 'Toshkent', 'Xorazm', 'Navoiy', 'Jizzax'];
const paymentTypeOptions = ['Naqd', "Pul o'tkazish"];
const truckTypeOptions = ['Tent', 'Ref', 'Plashatka'];
const currencyOptions = ['UZS', 'USD', 'Rubl'];
const addresOptions = ref(addreses);
// fields
const direction = ref('');
const fromAddress = ref('');
const toAddress = ref('');
const truckType = ref([]);
const paymentType = ref('');
const loadName = ref('');
const descriptions = ref('');
const advance = ref('');
const price = ref('');
const currency = ref('UZS');
const weight = ref();
const volume = ref();
const loadingTime = ref('');
const phone = ref('');
const clientName = ref('');

function filterFn(val: string, update: (arg0: { (): void; (): void }) => void) {
  if (val === '') {
    update(() => {
      addresOptions.value = addreses;
    });
    return;
  }
  update(() => {
    const needle = val.toLowerCase();
    addresOptions.value = addreses.filter((v) => v.toLowerCase().indexOf(needle) > -1);
  });
}
function addLoad() {
  axios
    .post('advertisements', {
      direction: direction.value,
      fromAddress: fromAddress.value,
      toAddress: toAddress.value,
      truckType: truckType.value,
      loadName: loadName.value,
      weight: weight.value,
      paymentType: paymentType.value,
      loadingTime: loadingTime.value,
      volume: volume.value,
      descriptions: descriptions.value,
      advance: advance.value,
      deliveryCost: price.value,
      currency: currency.value,
      phone: phone.value,
      clientName: clientName.value,
    })
    .then((res) => {
      console.log(res);
    })
    .catch(() => {});
}
</script>
