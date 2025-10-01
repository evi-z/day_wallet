<template>
    <q-page class="fit page-container">
        <InnerLoading :showing="state.loading" label="Загрузка..." />
        <q-toolbar class="page-toolbar bg-grey-4 no-padding" v-if="!state.loading">
            <q-tabs v-model="state.currentTabType" no-caps>
                <q-tab v-for="doc in periodDocuments" :key="doc._id" name="calendar" :label="doc.data.name">
                    <q-menu touch-position context-menu>
                        <q-list dense>
                            <q-item clickable v-close-popup @click="handleDelete(doc._id)">
                                <q-item-section>
                                    <q-item-label>Удалить документ</q-item-label>
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </q-menu>
                </q-tab>
                <q-tab v-if="state.currentTabType === 'init'" name="init" label="Новый период" key="init" />
                <q-btn v-else>+</q-btn>
            </q-tabs>
        </q-toolbar>

        <q-tab-panels v-model="state.currentTabType" class="page-tab-panels fit">
            <q-tab-panel name="init">
                <InitBody @created="fetchPeriodDocuments" />
            </q-tab-panel>
            <q-tab-panel name="calendar">
                <CalendarWalletBody />
            </q-tab-panel>
        </q-tab-panels>

    </q-page>
</template>

<script setup lang="ts">
import InitBody from './InitBody.vue';
import CalendarWalletBody from './CalendarWalletBody.vue';
import { onMounted, reactive, ref } from 'vue';
import InnerLoading from 'src/components/InnerLoading/index.vue';
import app from 'src/services/app';
import { PeriodDocumentDBData } from 'src/models/database';

const state = reactive({
    loading: true,
    currentTabType: null as 'init' | 'calendar' | null,
    currentCalendarTabId: null as string | null,
})

const periodDocuments = ref<PeriodDocumentDBData[]>([])

const openCalendarTab = (id: string) => {
    state.currentCalendarTabId = id
    state.currentTabType = 'calendar'
}

const fetchPeriodDocuments = async (selectTabId?: string) => {
    state.loading = true
    return app.userDb!.fetchPeriodDocuments().then((res) => {
        periodDocuments.value.splice(0, periodDocuments.value.length)

        if (!res.length) {  // Нет периодов
            state.currentTabType = 'init'
            return
        }

        periodDocuments.value = res
        openCalendarTab(selectTabId || res[0]!._id!)
    }).finally(() => {
        state.loading = false
    })
}

onMounted(async () => {
    await fetchPeriodDocuments()
})

const handleDelete = async (id: string) => {
    await app.userDb!.removePeriodDocument(id)
    await fetchPeriodDocuments()
}

</script>

<style lang="scss" scoped>
.page-container {
    .page-toolbar {
        // padding: 0 16px;
        min-height: 36px !important;
    }

    .page-tab-panels {
        // padding: 0 16px;
    }
}
</style>
