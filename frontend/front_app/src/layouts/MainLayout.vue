<template>
    <q-layout view="lHh Lpr lFf" class="fit">
        <q-header elevated>
            <q-toolbar class="toolbar">
                <!-- <q-btn flat dense round icon="menu" aria-label="Menu"/> -->

                <q-toolbar-title>
                    <div class="row items-center">
                        <q-icon name="account_balance_wallet" size="2rem" color="white"></q-icon>
                        <span class="q-ml-sm">Day Wallet</span>
                    </div>

                </q-toolbar-title>

                <!-- <div>v1.0</div> -->
                <div class="row items-center q-gutter-x-sm">
                    <q-btn flat dense rounded no-caps icon="sym_o_database_upload" @click="exportDataBtnClick">
                        <q-tooltip>Экспорт данных</q-tooltip>
                    </q-btn>
                    <q-btn v-if="app.state.mode === APP_MODE.local" flat dense rounded no-caps
                        class="row items-center text-yellow-2 q-pr-xs">
                        <q-icon name="sym_o_offline_bolt" size="26px" />
                        <span class="text-body1 q-ml-xs">Оффлайн режим</span>
                    </q-btn>
                    <q-btn flat dense round :icon="app.state.mode === APP_MODE.local ? 'sym_o_login' : 'sym_o_logout'"
                        :aria-label="logoutBtnLabel" @click="logoutBtnClick">
                        <q-tooltip>
                            {{ logoutBtnLabel }}
                        </q-tooltip>
                    </q-btn>
                </div>
            </q-toolbar>
        </q-header>

        <q-page-container class="page-container">
            <router-view />
        </q-page-container>
    </q-layout>
</template>

<script setup lang="ts">
import { PAGES } from 'src/router/models';
import { useRouter } from 'vue-router';
import app from 'src/services/app';
import { APP_MODE } from 'src/services/app/models';
import { computed } from 'vue';
import { downloadBlobFile } from 'src/utils/js-utils';

const $router = useRouter();

const logoutBtnLabel = computed(() => {
    return app.state.mode === APP_MODE.local ? 'Войти' : 'Выйти';
});

const logoutBtnClick = async () => {
    if (app.state.mode === APP_MODE.remote) await app.logout()
    $router.push({ name: PAGES.Login })
}

const exportDataBtnClick = async () => {
    try {
        const res = await app.userDb!.db.allDocs({ include_docs: true });

        const exportData = {
            docs: res.rows.map((d) => d.doc),
        }
        console.log(exportData)
        
        // Преобразуем данные в JSON строку с форматированием
        const jsonString = JSON.stringify(exportData, null, 2);
        
        // Создаем Blob с типом text/plain для plain text файла
        const blob = new Blob([jsonString], { type: 'text/plain;charset=utf-8' });
        
        downloadBlobFile(blob, `day_wallet_export_${new Date().toISOString().split('T')[0]}.json`);
    } catch (error) {
        console.error('Ошибка при экспорте данных:', error);
    }
}
</script>

<style lang="scss">
.toolbar {
    height: 50px;
}

.page-container {
    height: calc(100% - 50px);
}
</style>
