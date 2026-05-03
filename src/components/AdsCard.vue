<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <q-card v-for="(ad, index) in ads" :key="index" class="my-card p-4">
      <div class="flex justify-center gap-1 items-center">
        <span class="title text-primary">{{ ad.fromAddress }}</span>
        <div class="text-center">
          <q-icon class="text-primary" name="arrow_forward" />
        </div>
        <span class="title text-primary">{{ ad.toAddress }}</span>
      </div>
      <q-separator />
      <div class="flex items-center justify-between gap-2">
        <span class="title">Mashina:</span>
        <span class="text">
          <template v-for="(truckType, index) in ad.truckType" :key="index">
            {{ truckType + `${ad.truckType?.length - 1 > index ? '/' : ''}` }}
          </template>
        </span>
      </div>
      <q-separator />
      <div class="flex items-center justify-between gap-2">
        <span class="title">Yuk:</span>
        <span class="text">{{
          (ad.loadName ? ad.loadName : '') +
          (ad.weight ? (ad.loadName ? ', ' : '') + ad.weight + ' tonna' : '') +
          (ad.volume ? (ad.weight ? ', ' : '') + ad.volume + ' kub' : '')
        }}</span>
      </div>
      <q-separator />
      <div class="flex items-center justify-between gap-2">
        <span class="title">Qo'shimcha:</span>
        <p class="text text-justify">
          {{ ad.descriptions }}
        </p>
      </div>
      <q-separator />
      <div class="flex items-center justify-between gap-4">
        <span class="title">Tolov turi:</span>
        <span class="text">{{ ad.paymentType }}</span>
      </div>
      <q-separator />
      <div class="flex items-center justify-between gap-4">
        <span class="title">Avans:</span>
        <span class="text">{{ ad.advance }}</span>
      </div>
      <q-separator />
      <div class="flex items-center justify-between gap-4">
        <span class="title">Yo'l haqi:</span>
        <span class="text">{{ ad.deliveryCost }}</span>
      </div>
      <q-separator />
      <div class="flex items-center justify-between py-2">
        <div class="flex items-center gap-1">
          <q-icon size="20px" avatar name="event" />
          <span class="text"> {{ ad.loadingTime }} </span>
        </div>
        <a class="text text-primary" :href="'tel:' + ad.phone">{{ ad.phone }}</a>
      </div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
defineProps(['ads']);
</script>
