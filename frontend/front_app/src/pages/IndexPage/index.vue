<template>
    <q-page class="fit page-container">
        <InnerLoading :showing="isLoading" label="Загрузка..." />
        <q-toolbar class="page-toolbar bg-grey-4 no-padding">
            <q-tabs v-model="currentTab" no-caps>
                <q-tab v-for="tab in tabs" :key="tab.name" :name="tab.name" :label="tab.label" />
                <q-tab v-if="currentTab === 'init'" name="init" label="Новый период" key="init" />
            </q-tabs>
        </q-toolbar>

        <q-tab-panels v-model="currentTab" class="page-tab-panels fit">
            <q-tab-panel name="init">
                <InitBody />
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
import { onMounted, ref } from 'vue';
import InnerLoading from 'src/components/InnerLoading/index.vue';

const isLoading = ref(true)
const currentTab = ref('init')

const tabs = ref([])

const fetchTabs = async () => {
    // TODO: Fetch tabs from backend
    await new Promise(resolve => setTimeout(resolve, 200))
    isLoading.value = false
}

onMounted(async () => {
    await fetchTabs()
})

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
