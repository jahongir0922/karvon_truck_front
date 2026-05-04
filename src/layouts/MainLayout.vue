<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-grey-3 text-primary">
      <q-toolbar>
        <q-toolbar-title class="font-bold">Karvon</q-toolbar-title>
        <template v-if="auth.isLoggedIn">
          <span class="text-sm mr-2">{{ auth.user?.name }}</span>
          <q-btn flat dense icon="logout" @click="handleLogout" />
        </template>
        <template v-else>
          <q-btn flat dense label="Kirish" to="/login" />
        </template>
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
        <q-route-tab to="/my-ads" exact replace label="Mening yuklarim" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth';

const auth = useAuthStore();
const router = useRouter();

onMounted(() => {
  void auth.fetchMe();
});

function handleLogout() {
  auth.logout();
  void router.push('/');
}
</script>
