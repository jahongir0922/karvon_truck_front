<template>
  <main>
    <q-drawer v-model="leftDrawerOpen" overlay :width="320" class="p-2" side="right" bordered>
      <q-item-section avatar>
        <q-btn
          size="20px"
          flat
          dense
          icon="keyboard_arrow_right"
          aria-label="right"
          @click="toggleLeftDrawer"
        />
      </q-item-section>
      <div class="flex flex-col gap-3">
        <div class="flex gap-2">
          <q-radio
            class="text-[18px]"
            name="shape"
            v-model="shape"
            val="international"
            label="Xalqaro"
          />
          <q-radio
            class="text-[18px]"
            name="shape"
            v-model="shape"
            val="intercity"
            label="Shaharlararo"
          />
        </div>
        <q-select
          filled
          v-model="model"
          use-input
          input-debounce="0"
          label="Qayerdan"
          :options="options"
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
          v-model="model"
          use-input
          input-debounce="0"
          label="Qayerga"
          :options="options"
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
          v-model="optionMultiple"
          use-input
          clearable
          multiple
          input-debounce="0"
          label="Mashina turi"
          :options="options"
          @filter="filterFn"
          behavior="menu"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey"> No results </q-item-section>
            </q-item>
          </template>
        </q-select>
        <div class="grid grid-cols-2 gap-2">
          <q-input v-model="priceFrom" label="Minimal narx" />
          <q-input v-model="priceTo" label="Maximal narx" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <q-input v-model="priceFrom" label="Minimal yuk vazni" />
          <q-input v-model="priceTo" label="Maximal yuk vazni" />
        </div>
        <q-btn color="primary" label="Ok" @click="toggleLeftDrawer" />
      </div>
    </q-drawer>
    <q-page>
      <div v-if="!store.isChangeDirect" class="flex flex-col h-[100vh] justify-center items-center">
        <div class="flex flex-col items-center">
          <div class="text-xl mb-4 font-bold">Yuk qidirish uchun yo'nalish tanlang</div>
          <div class="flex w-full gap-2">
            <q-radio
              class="text-[18px]"
              name="shape"
              v-model="shape"
              val="international"
              label="Xalqaro"
            />
            <q-radio
              class="text-[18px]"
              name="shape"
              v-model="shape"
              val="intercity"
              label="Shaharlararo"
            />
          </div>
          <q-select
            ref="qSelectRef"
            filled
            v-model="optionMultiple"
            use-input
            clearable
            input-debounce="0"
            label="Yo'nalish tanlang"
            :options="options"
            @filter="filterFn"
            @update:model-value="
              (el) => {
                if (qSelectRef) {
                  qSelectRef.blur();
                }
              }
            "
            behavior="menu"
            class="p-2 min-w-[300px] sm:min-w-[450px]"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No results </q-item-section>
              </q-item>
            </template>
          </q-select>
          <div class="flex w-full p-2 justify-end">
            <q-btn
              :disabled="!optionMultiple?.length || !shape"
              color="primary"
              label="Ok"
              class="min-w-[100px]"
              @click="
                () => {
                  store.changeDirect('1');
                }
              "
            />
          </div>
        </div>
      </div>
      <template v-if="store.isChangeDirect">
        <div class="flex gap-2 mb-4 justify-between">
          <q-select
            filled
            v-model="optionMultiple"
            use-input
            clearable
            input-debounce="0"
            label="Yo'nalish tanlang"
            :options="options"
            @filter="filterFn"
            behavior="menu"
            class="min-w-[300px] sm:min-w-[450px]"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No results </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-btn
            size="20px"
            flat
            dense
            icon="filter_list"
            aria-label="Menu"
            @click="toggleLeftDrawer"
          />
        </div>
        <ads-card :ads="ads" active></ads-card>
      </template>
    </q-page>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AdsCard from 'components/AdsCard.vue';
import { useCounterStore } from 'stores/counter';
import axios from 'axios';
import { QSelect } from 'quasar';
const qSelectRef = ref<QSelect | null>(null);
const store = useCounterStore();
const shape = ref('');
const stringOptions = ['Barcha yonalishlar', 'Google', 'Facebook', 'Twitter', 'Apple', 'Oracle'];
const options = ref(stringOptions);
const optionMultiple = ref([]);
const model = ref(null);
const priceFrom = ref('');
const priceTo = ref('');
const ads = ref<Array<object>>([]);
const leftDrawerOpen = ref(false);

function filterFn(val: string, update: (arg0: { (): void; (): void }) => void) {
  if (val === '') {
    update(() => {
      options.value = stringOptions;
    });
    return;
  }
  update(() => {
    const needle = val.toLowerCase();
    options.value = stringOptions.filter((v) => v.toLowerCase().indexOf(needle) > -1);
  });
}
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
function getLoads() {
  void axios.get('advertisements').then((res) => {
    ads.value = [...res.data];
  });
}
getLoads();
</script>
