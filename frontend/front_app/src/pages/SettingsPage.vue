<template>
    <q-page class="section-page">
        <div class="section-head">
            <div class="section-subtitle">Режим, синхронизация и данные</div>
        </div>

        <div class="settings-grid">
            <q-card flat bordered class="settings-card">
                <q-card-section class="settings-card__title">Режим и синхронизация</q-card-section>
                <q-separator />
                <q-list dense class="settings-list">
                    <q-item>
                        <q-item-section avatar>
                            <q-icon :name="isLocal ? 'sym_o_offline_bolt' : 'sym_o_person'" color="primary" />
                        </q-item-section>
                        <q-item-section>
                            <q-item-label>{{ isLocal ? 'Оффлайн-режим' : (app.user?.email || 'Аккаунт') }}</q-item-label>
                            <q-item-label caption>
                                {{ isLocal ? 'Данные только в этом браузере' : 'Данные синхронизируются с облаком' }}
                            </q-item-label>
                        </q-item-section>
                    </q-item>
                    <q-item v-if="!isLocal">
                        <q-item-section avatar>
                            <q-icon :name="syncIcon" :color="syncColor" />
                        </q-item-section>
                        <q-item-section>
                            <q-item-label>{{ syncLabel }}</q-item-label>
                            <q-item-label caption>{{ syncHint }}</q-item-label>
                        </q-item-section>
                    </q-item>
                </q-list>
            </q-card>

            <q-card flat bordered class="settings-card">
                <q-card-section class="settings-card__title">Данные</q-card-section>
                <q-separator />
                <q-card-section class="q-gutter-y-sm">
                    <div class="row q-gutter-sm">
                        <q-btn outline color="primary" no-caps icon="sym_o_download" label="Экспорт"
                            @click="handleExport" />
                        <q-btn outline color="primary" no-caps icon="sym_o_upload" label="Импорт"
                            :disable="!isLocal" @click="handleImportClick" />
                    </div>
                    <div class="text-caption text-grey-7">
                        Импорт доступен только в оффлайн-режиме и обновляет документы по id.
                    </div>
                    <input ref="fileInput" type="file" accept=".json,application/json" class="hidden"
                        @change="handleFile" />
                </q-card-section>
            </q-card>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import app from 'src/services/app';
import { APP_MODE, SYNC_STATUS } from 'src/services/app/models';
import { exportUserData, importUserData } from 'src/services/data_transfer';

const $q = useQuasar();
const fileInput = ref<HTMLInputElement | null>(null);

const isLocal = computed(() => app.state.mode === APP_MODE.local);

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
            return 'Ошибка синхронизации';
        default:
            return 'Облако';
    }
});

const syncHint = computed(() => {
    if (isLocal.value) return 'Облако не используется';
    if (app.state.syncStatus === SYNC_STATUS.error) {
        return app.state.syncError || 'Неизвестная ошибка';
    }
    if (app.state.syncStatus === SYNC_STATUS.syncing || app.state.syncStatus === SYNC_STATUS.connecting) {
        return 'Идёт обмен с CouchDB';
    }
    if (app.state.syncStatus === SYNC_STATUS.synced) return 'Все изменения сохранены';
    return 'Подключение к облаку';
});

const handleExport = async () => {
    try {
        await exportUserData();
        $q.notify({ type: 'positive', message: 'Файл выгружен' });
    } catch (error) {
        console.error('Ошибка экспорта:', error);
        $q.notify({ type: 'negative', message: 'Не удалось выгрузить данные' });
    }
};

const handleImportClick = () => {
    if (!isLocal.value) {
        $q.notify({ type: 'warning', message: 'Импорт доступен только в оффлайн-режиме' });
        return;
    }
    fileInput.value?.click();
};

const handleFile = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    try {
        const count = await importUserData(file);
        $q.notify({ type: 'positive', message: `Загружено документов: ${count}` });
        setTimeout(() => window.location.reload(), 600);
    } catch (error) {
        console.error('Ошибка импорта:', error);
        $q.notify({
            type: 'negative',
            message: error instanceof Error ? error.message : 'Ошибка импорта',
        });
    }
};
</script>

<style lang="scss" scoped>
.section-page {
    padding: 10px 16px 16px;
    max-width: 1100px;
}

.section-head {
    margin-bottom: 10px;
}

.section-subtitle {
    font-size: 12px;
    color: #6b7280;
}

.settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 12px;
    align-items: start;
}

.settings-card {
    border-radius: 10px;
}

.settings-card__title {
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
}

.settings-list {
    padding: 4px 0;
}
</style>
