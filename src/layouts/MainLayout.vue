<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-grey-3 text-primary">
      <q-toolbar>
        <q-toolbar-title> Karvon </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="fade">
          <component :is="Component" :key="$route.path" />
        </transition>
      </router-view>
    </q-page-container>
    <q-footer elevated class="bg-grey-3 text-primary">
      <q-tabs no-caps>
        <q-route-tab to="/" exact replace label="Yuklar" />
        <q-route-tab to="/create-ads" exact replace label="Yuk qo'shish" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts"></script>
