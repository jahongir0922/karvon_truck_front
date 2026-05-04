import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'create-ads', component: () => import('pages/CreateAd.vue') },
      {
        path: 'my-ads',
        component: () => import('pages/MyAds.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'admin',
        component: () => import('pages/AdminPage.vue'),
        meta: { requiresAuth: true },
        redirect: '/admin/countries',
        children: [
          { path: 'countries', component: () => import('pages/admin/AdminCountries.vue') },
          { path: 'provinces', component: () => import('pages/admin/AdminProvinces.vue') },
          { path: 'cities', component: () => import('pages/admin/AdminCities.vue') },
        ],
      },
    ],
  },
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue'),
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
