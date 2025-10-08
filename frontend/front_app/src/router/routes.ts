import type { RouteRecordRaw } from 'vue-router';
import { PAGES } from './models';

const routes: RouteRecordRaw[] = [
    {
        path: '/login',
        component: () => import('pages/login/index.vue'),
        name: PAGES.Login,
    },
    {
        path: '/',
        component: () => import('layouts/MainLayout.vue'),
        name: PAGES.Index,
        children: [{ path: '', component: () => import('pages/IndexPage/index.vue') }],
    },

    // Always leave this as last one,
    // but you can also remove it
    {
        path: '/:catchAll(.*)*',
        component: () => import('pages/ErrorNotFound.vue'),
    },
];

export default routes;
