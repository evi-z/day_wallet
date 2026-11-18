<template>
    <q-page class="pulse-page">
        <InnerLoading :showing="state.loading" />

        <div class="pulse-toolbar">
            <q-btn-dropdown class="pulse-account" flat dense no-caps icon="sym_o_wallet"
                :label="$q.screen.gt.xs ? 'Жизнь' : undefined" :hide-dropdown-icon="!$q.screen.gt.xs">
                <q-list dense>
                    <q-item clickable v-close-popup>
                        <q-item-section>Жизнь</q-item-section>
                        <q-item-section side>
                            <q-icon name="sym_o_check" size="16px" color="primary" />
                        </q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item disabled>
                        <q-item-section class="text-grey-6">Другие счета — позже</q-item-section>
                    </q-item>
                </q-list>
            </q-btn-dropdown>

            <q-separator vertical class="pulse-toolbar__sep" />

            <q-tabs v-model="state.currentTab" dense no-caps align="left" class="pulse-tabs"
                active-color="primary" indicator-color="primary" :mobile-arrows="false">
                <q-tab v-for="tab in documentTabs" :key="tab._id" :name="tab._id" :label="tab.name">
                    <q-menu touch-position context-menu>
                        <q-list dense>
                            <q-item clickable v-close-popup @click="handleDelete(tab)">
                                <q-item-section>
                                    <q-item-label>Удалить документ</q-item-label>
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </q-menu>
                </q-tab>
                <q-tab v-if="state.currentTab === 'init'" name="init" label="Новый период" />
            </q-tabs>

            <q-btn flat dense round icon="sym_o_add" class="pulse-add" @click="handleAddPeriod">
                <q-tooltip>Добавить период</q-tooltip>
            </q-btn>
        </div>

        <q-tab-panels v-model="state.currentTab" class="pulse-panels">
            <q-tab-panel name="init" class="pulse-panel">
                <InitBody @created="handlePeriodCreated" />
            </q-tab-panel>
            <q-tab-panel v-for="tab in documentTabs" :key="tab._id!" :name="tab._id!" class="pulse-panel">
                <PeriodDocumentBody :document="tab" @updated="handleDocumentUpdated" />
            </q-tab-panel>
        </q-tab-panels>
    </q-page>
</template>

<script setup lang="ts">
import InitBody from './InitBody.vue';
import PeriodDocumentBody from './PeriodDocumentBody/index.vue';
import { onMounted, reactive, ref } from 'vue';
import InnerLoading from 'src/components/InnerLoading/index.vue';
import app from 'src/services/app';
import { PeriodDocumentDBData } from 'src/models/database';
import { useAppValuesRef } from 'src/services/database/wrappers/app';
import { watch } from 'vue';
import { useQuasar } from 'quasar';

const state = reactive({
    loading: true,
    currentTab: null as string | null,
})

const $q = useQuasar()

const appValues = useAppValuesRef()
const documentTabs = ref<PeriodDocumentDBData[]>([])

watch(() => state.currentTab, (val: string | null) => {
    if (val) appValues.value.lastPeriodDocument = val
})

/** Открывает последний открытый документ (либо последний созданный) */
const openLastCalendarTab = async () => {
    const openLastDocument = () => {
        const lastDocument = documentTabs.value[documentTabs.value.length - 1]
        if (lastDocument) state.currentTab = lastDocument._id!
    }

    const lastDocument = appValues.value.lastPeriodDocument
    if (lastDocument) {  // Если есть последний открытый документ
        if (lastDocument === 'init' || documentTabs.value.find(tab => tab._id === lastDocument)) {  // Если документ существует
            state.currentTab = lastDocument
        } else openLastDocument()
    } else openLastDocument()
}

const fetchPeriodDocuments = async () => {
    state.loading = true
    return app.userDb!.fetchPeriodDocuments().then(async (res) => {
        documentTabs.value.splice(0, documentTabs.value.length)

        if (!res.length) {  // Нет периодов
            state.currentTab = 'init'
            return
        }

        documentTabs.value = res
        await openLastCalendarTab()
    }).finally(() => {
        state.loading = false
    })
}

onMounted(async () => {
    await appValues.initFromDB()
    await fetchPeriodDocuments()
})

const handleDocumentUpdated = () => fetchPeriodDocuments()

/** После создания периода открываем его, а не остаёмся на форме */
const handlePeriodCreated = async (id: string) => {
    await fetchPeriodDocuments()
    if (documentTabs.value.some(tab => tab._id === id)) state.currentTab = id
}

const handleDelete = (tab: PeriodDocumentDBData) => {
    $q.dialog({
        title: 'Удалить период?',
        message: `«${tab.name}» и все его факты будут удалены. Изменение синхронизируется с облаком.`,
        cancel: { label: 'Отмена', flat: true },
        ok: { label: 'Удалить', color: 'negative', flat: true },
        persistent: true,
    }).onOk(async () => {
        await app.userDb!.removePeriodDocument(tab._id)
        await fetchPeriodDocuments()
    })
}

const handleAddPeriod = () => {
    state.currentTab = 'init'
}


</script>

<style lang="scss" scoped>
.pulse-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    padding: 6px 12px 10px;
    overflow: hidden;
}

.pulse-toolbar {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 2px;
    min-height: 34px;
}

.pulse-account {
    flex: 0 0 auto;
    font-weight: 500;
    color: #374151;
}

.pulse-toolbar__sep {
    height: 18px;
    margin: 0 6px;
}

.pulse-tabs {
    flex: 1 1 auto;
    min-height: 32px;
    min-width: 0;
}

.pulse-tabs :deep(.q-tab) {
    min-height: 32px;
    padding: 0 10px;
    color: #4b5563;
}

.pulse-tabs :deep(.q-tab--active) {
    color: $primary;
    font-weight: 500;
}

.pulse-tabs :deep(.q-tab__indicator) {
    height: 2px;
}

.pulse-add {
    flex: 0 0 auto;
    color: #4b5563;
}

.pulse-panels {
    flex: 1 1 auto;
    min-height: 0;
    background: transparent;
}

.pulse-panel {
    height: 100%;
    padding: 0;
    overflow: auto;
}

@media (max-width: 1023px) {
    .pulse-tabs :deep(.q-tabs__arrow) {
        display: none !important;
    }
}

@media (max-width: 599px) {
    .pulse-page {
        padding: 4px 8px 8px;
    }

    .pulse-tabs :deep(.q-tab) {
        padding: 0 8px;
        font-size: 13px;
    }
}
</style>
