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

        children: [{
            path: '',
            name: PAGES.Pulse,
            component: () => import('pages/IndexPage/index.vue'),
            meta: { title: 'Пульс', icon: 'sym_o_monitor_heart' },
        }, {
            path: 'accounts',
            name: PAGES.Accounts,
            component: () => import('pages/AccountsPage.vue'),
            meta: { title: 'Счета', icon: 'sym_o_account_balance_wallet' },
        }, {
            path: 'expenses',
            name: PAGES.Expenses,
            component: () => import('pages/ExpensesPage.vue'),
            meta: { title: 'Траты', icon: 'sym_o_receipt_long' },
        }, {
            path: 'plan',
            name: PAGES.Plan,
            component: () => import('pages/PlanPage.vue'),
            meta: { title: 'Бюджет', icon: 'sym_o_trending_up' },
        }, {
            path: 'settings',
            name: PAGES.Settings,
            component: () => import('pages/SettingsPage.vue'),
            meta: { title: 'Настройки', icon: 'sym_o_settings' },
        }],
    },

    // Always leave this as last one,
    // but you can also remove it
    {
        path: '/:catchAll(.*)*',
        component: () => import('pages/ErrorNotFound.vue'),
    },
];

export default routes;
