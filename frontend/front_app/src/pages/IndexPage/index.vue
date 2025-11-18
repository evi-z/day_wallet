<template>
    <q-page class="fit page-container">
        <InnerLoading :showing="state.loading" />
        <q-toolbar class="page-toolbar bg-grey-4 no-padding" v-if="!state.loading">
            <q-tabs dense class="tabs-toolbar" v-model="state.currentTab" no-caps>
                <q-tab v-for="tab in documentTabs" :key="tab._id" :name="tab._id" :label="tab.name">
                    <q-menu touch-position context-menu>
                        <q-list dense>
                            <q-item clickable v-close-popup @click="handleDelete(tab._id!)">
                                <q-item-section>
                                    <q-item-label>Удалить документ</q-item-label>
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </q-menu>
                </q-tab>
                <q-tab v-if="state.currentTab === 'init'" name="init" label="Новый период" key="init" />
                <q-btn v-else icon="add" flat @click="handleAddPeriod" >
                    <q-tooltip>Добавить период</q-tooltip>
                </q-btn>
            </q-tabs>
        </q-toolbar>
        <q-tab-panels v-model="state.currentTab" class="page-tab-panels fit">
            <q-tab-panel name="init">
                <InitBody @created="fetchPeriodDocuments" />
            </q-tab-panel>
            <q-tab-panel v-for="tab in documentTabs" :key="tab._id!" :name="tab._id!">
                <PeriodDocumentBody :document="tab" />
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

const state = reactive({
    loading: true,
    currentTab: null as string | null,
})

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

const handleDelete = async (id: string) => {
    await app.userDb!.removePeriodDocument(id)
    await fetchPeriodDocuments()
}

const handleAddPeriod = () => {
    state.currentTab = 'init'
}


</script>

<style lang="scss" scoped>
.page-container {
    .page-toolbar {
        min-height: unset;
        height: 36px !important;
    }

    .page-tab-panels {
        // padding: 0 16px;
    }
}
</style>
