<template>
    <q-layout view="hHh Lpr lFf" class="app-layout">
        <q-header class="app-header" height-hint="48">
            <q-toolbar class="app-toolbar">
                <q-btn v-if="isDesktop" flat dense round :icon="mini ? 'sym_o_menu' : 'sym_o_menu_open'"
                    class="app-header__menu" @click="mini = !mini">
                    <q-tooltip>{{ mini ? 'Показать подписи' : 'Свернуть в иконки' }}</q-tooltip>
                </q-btn>

                <div class="app-brand" @click="$router.push({ name: PAGES.Pulse })">
                    <q-icon name="account_balance_wallet" size="22px" color="primary" />
                    <span v-if="$q.screen.gt.xs" class="app-brand__name">Day Wallet</span>
                </div>

                <q-separator v-if="$q.screen.gt.sm" vertical class="app-header__sep" />
                <div class="app-header__section">{{ currentSection }}</div>

                <q-space />

                <q-btn flat dense no-caps :icon="syncIcon" :color="syncColor"
                    :label="$q.screen.gt.sm ? syncLabel : undefined" class="app-header__sync">
                    <q-tooltip>{{ syncTooltip }}</q-tooltip>
                </q-btn>

                <q-btn flat dense round :icon="loginIcon" class="app-header__user" @click="logoutBtnClick">
                    <q-tooltip>{{ logoutBtnLabel }}</q-tooltip>
                </q-btn>
            </q-toolbar>
        </q-header>

        <q-drawer v-if="isDesktop" v-model="drawerVisible" show-if-above :mini="mini" :width="216"
            :mini-width="56" class="app-drawer" :breakpoint="0">
            <div class="app-drawer__inner" :class="{ 'app-drawer__inner--mini': mini }">
                <q-list class="app-nav">
                    <q-item v-for="item in navItems" :key="item.name" clickable :to="{ name: item.name }" exact
                        class="app-nav__item" active-class="app-nav__item--active">
                        <q-item-section avatar class="app-nav__avatar">
                            <q-icon :name="item.icon" size="20px" />
                        </q-item-section>
                        <q-item-section class="app-nav__label">{{ item.label }}</q-item-section>
                        <q-tooltip v-if="mini" anchor="center right" self="center left" :offset="[8, 0]">
                            {{ item.label }}
                        </q-tooltip>
                    </q-item>
                </q-list>

                <q-space />

                <q-separator class="app-drawer__sep" />

                <q-list class="app-nav">
                    <q-item clickable :to="{ name: PAGES.Settings }" exact class="app-nav__item"
                        active-class="app-nav__item--active">
                        <q-item-section avatar class="app-nav__avatar">
                            <q-icon name="sym_o_settings" size="20px" />
                        </q-item-section>
                        <q-item-section class="app-nav__label">Настройки</q-item-section>
                        <q-tooltip v-if="mini" anchor="center right" self="center left" :offset="[8, 0]">
                            Настройки
                        </q-tooltip>
                    </q-item>
                </q-list>
            </div>
        </q-drawer>

        <q-page-container class="app-page-container">
            <router-view />
        </q-page-container>

        <q-footer v-if="!isDesktop" class="app-mobile-nav">
            <q-tabs class="app-mobile-tabs" active-color="primary" indicator-color="transparent" dense no-caps>
                <q-route-tab v-for="item in mobileNav" :key="item.name" :to="{ name: item.name }" :icon="item.icon"
                    :label="item.label" exact class="app-mobile-tab" />
            </q-tabs>
        </q-footer>
    </q-layout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { PAGES } from 'src/router/models';
import app from 'src/services/app';
import { APP_MODE, SYNC_STATUS } from 'src/services/app/models';

const $q = useQuasar();
const $router = useRouter();
const route = useRoute();

const isDesktop = computed(() => $q.screen.gt.sm);
const isLocal = computed(() => app.state.mode === APP_MODE.local);
const drawerVisible = ref(true);
const mini = ref(localStorage.getItem('dw-drawer-mini') === '1');

watch(mini, (value) => localStorage.setItem('dw-drawer-mini', value ? '1' : '0'));

const navItems = [
    { name: PAGES.Pulse, label: 'Пульс', icon: 'sym_o_monitor_heart' },
    { name: PAGES.Accounts, label: 'Счета', icon: 'sym_o_account_balance_wallet' },
    { name: PAGES.Expenses, label: 'Траты', icon: 'sym_o_receipt_long' },
    { name: PAGES.Plan, label: 'Бюджет', icon: 'sym_o_trending_up' },
];

const mobileNav = [
    ...navItems,
    { name: PAGES.Settings, label: 'Ещё', icon: 'sym_o_more_horiz' },
];

const currentSection = computed(() => route.meta.title || 'Day Wallet');

const syncIcon = computed(() => {
    if (isLocal.value) return 'sym_o_offline_bolt';
    switch (app.state.syncStatus) {
        case SYNC_STATUS.syncing:
        case SYNC_STATUS.connecting:
            return 'sym_o_sync';
        case SYNC_STATUS.synced:
            return 'sym_o_cloud_done';
        case SYNC_STATUS.error:
            return 'sym_o_cloud_off';
        default:
            return 'sym_o_cloud';
    }
});

const syncColor = computed(() => {
    if (isLocal.value) return 'grey-7';
    if (app.state.syncStatus === SYNC_STATUS.error) return 'negative';
    if (app.state.syncStatus === SYNC_STATUS.syncing || app.state.syncStatus === SYNC_STATUS.connecting) return 'warning';
    return 'positive';
});

const syncLabel = computed(() => {
    if (isLocal.value) return 'Локальный режим';
    switch (app.state.syncStatus) {
        case SYNC_STATUS.syncing:
        case SYNC_STATUS.connecting:
            return 'Синхронизация';
        case SYNC_STATUS.synced:
            return 'В облаке';
        case SYNC_STATUS.error:
            return 'Ошибка';
        default:
            return 'Облако';
    }
});

const syncTooltip = computed(() => {
    if (isLocal.value) return 'Данные хранятся только в этом браузере';
    if (app.state.syncStatus === SYNC_STATUS.error) {
        return `Ошибка синхронизации: ${app.state.syncError || 'неизвестная ошибка'}`;
    }
    if (app.state.syncStatus === SYNC_STATUS.syncing) return 'Идёт обмен с облаком';
    if (app.state.syncStatus === SYNC_STATUS.synced) return 'Все изменения сохранены в облаке';
    return 'Подключение к облаку';
});

const loginIcon = computed(() => isLocal.value ? 'sym_o_login' : 'sym_o_logout');
const logoutBtnLabel = computed(() => isLocal.value ? 'Войти' : 'Выйти');

const logoutBtnClick = async () => {
    if (!isLocal.value) await app.logout();
    $router.push({ name: PAGES.Login });
};
</script>

<style lang="scss" scoped>
.app-layout {
    background: #f5f7f6;
    height: 100vh;
    min-height: 100vh;
    overflow: hidden;
}

.app-header {
    background: #fff;
    color: #111827;
    box-shadow: 0 1px 0 #e5e7eb;
}

.app-toolbar {
    min-height: 48px;
    padding: 0 10px;
    gap: 2px;
}

.app-header__menu {
    color: #4b5563;
}

.app-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 4px;
    cursor: pointer;
}

.app-brand__name {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.1px;
    color: #111827;
}

.app-header__sep {
    height: 20px;
    margin: 0 10px;
}

.app-header__section {
    font-size: 14px;
    font-weight: 500;
    color: #4b5563;
}

.app-header__sync {
    font-size: 12px;
}

.app-header__user {
    color: #4b5563;
}

.app-drawer {
    background: #f8faf9;
    border-right: 1px solid #e5e7eb;
}

.app-drawer__inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 8px;
}

.app-nav {
    padding: 0;
}

.app-nav__item {
    min-height: 40px;
    border-radius: 8px;
    color: #374151;
    font-size: 14px;
}

.app-nav__item--active {
    background: rgba(6, 95, 70, 0.09);
    color: #065f46;
    font-weight: 500;
}

.app-nav__item--active .q-icon {
    color: #065f46;
}

.app-nav__avatar {
    min-width: 36px;
    padding-right: 6px;
}

.app-nav__label {
    font-size: 14px;
}

.app-drawer__sep {
    margin: 8px 4px;
}

.app-drawer__inner--mini {
    padding: 8px 4px;

    .app-nav__item {
        justify-content: center;
        padding: 0 8px;
    }

    .app-nav__avatar {
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-width: 0;
        padding: 0;
    }

    .app-nav__label {
        display: none;
    }

    .app-drawer__sep {
        margin: 8px;
    }
}

.app-page-container {
    background: #f5f7f6;
    height: 100vh;
    overflow-x: hidden;
    overflow-y: auto;
}

.app-mobile-nav {
    background: #fff;
    color: #4b5563;
    border-top: 1px solid #e5e7eb;
}

.app-mobile-tabs {
    height: 56px;
}

.app-mobile-tab {
    min-height: 56px;
    padding: 0;
}

.app-mobile-tab :deep(.q-tab__label) {
    font-size: 11px;
    line-height: 1.2;
}
</style>
