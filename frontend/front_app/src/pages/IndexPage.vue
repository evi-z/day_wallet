<template>
    <q-page class="fit q-pa-md page-container">
        <div class="adaptive-grid full-height">
            <!-- Исходные данные -->
            <div class="grid-item-source">
                <q-card class="full-height">
                    <q-card-section class="card-title-section">
                        <div class="text-subtitle1">Исходные данные</div>
                    </q-card-section>
                    <q-separator></q-separator>
                    <q-card-section class="no-padding card-table-section">
                        <q-table class="full-height" :columns="InitAndCurrentDataColumns" :rows="InitDataRows" hide-header dense
                            :rows-per-page="[0]" v-model:pagination="initCurrentPagination" hide-bottom></q-table>
                    </q-card-section>
                </q-card>
            </div>

            <!-- Текущие данные -->
            <div class="grid-item-current">
                <q-card class="full-height">
                    <q-card-section class="card-title-section">
                        <div class="text-subtitle1">Текущие данные</div>
                    </q-card-section>
                    <q-separator></q-separator>
                    <q-card-section class="no-padding card-table-section">
                        <q-table class="full-height" :columns="InitAndCurrentDataColumns" :rows="CurrentDataRows" hide-header dense
                            :rows-per-page="[0]" v-model:pagination="initCurrentPagination" hide-bottom></q-table>
                    </q-card-section>
                </q-card>
            </div>

            <!-- Результат -->
            <div class="grid-item-result">
                <q-card class="full-height">
                    <q-card-section class="card-title-section">
                        <div class="text-subtitle1">Результат</div>
                    </q-card-section>
                    <q-separator></q-separator>
                </q-card>
            </div>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { QTableColumn } from 'quasar';
import { CurrentDataFields, CurrentDataFieldsMap, InitDataFields, InitDataFieldsMap } from 'src/models/wallet';
import { ref, shallowRef } from 'vue';

const initCurrentPagination = ref({ rowsPerPage: 0 })

const InitAndCurrentDataColumns: QTableColumn[] = [
    { field: 'label', name: 'label', label: 'name', align: 'left' },
    { field: 'value', name: 'value', label: 'value' },
] as const

type InitAndCurrentBaseRow<T extends string> = {
    name: T,
    label: string,
    type: 'text' | 'input',
    value: any,
}

const InitDataRows = shallowRef<InitAndCurrentBaseRow<InitDataFieldsMap>[]>([
    {
        name: InitDataFields.total_budget,
        value: 0,
        label: 'Общий бюджет',
        type: 'input',
    },
    {
        name: InitDataFields.weekend_plan,
        value: 0,
        label: 'План на выходные',
        type: 'input',
    },
    {
        name: InitDataFields.total_days,
        value: 0,
        label: 'Всего дней',
        type: 'text',
    },
    {
        name: InitDataFields.weekend_days,
        value: 0,
        label: 'Выходных дней',
        type: 'text',
    },
    {
        name: InitDataFields.weekday_days,
        value: 0,
        label: 'Будних дней',
        type: 'text',
    },

    {
        name: InitDataFields.total_weekends_budget,
        value: 0,
        label: 'Бюджет на выходные',
        type: 'text',
    },

    {
        name: InitDataFields.total_weekdays_budget,
        value: 0,
        label: 'Бюджет на будни',
        type: 'text',
    },

    {
        name: InitDataFields.initial_plan,
        value: 0,
        label: 'Начальный план',
        type: 'text',
    },
])

const CurrentDataRows = shallowRef<InitAndCurrentBaseRow<CurrentDataFieldsMap>[]>([
    {
        name: CurrentDataFields.current_date,
        value: 0,
        label: 'Текущая дата',
        type: 'text',
    },
    {
        name: CurrentDataFields.days_remaining,
        value: 0,
        label: 'Осталось дней',
        type: 'text',
    },
    {
        name: CurrentDataFields.weekends_remaining,
        value: 0,
        label: 'Осталось выходных',
        type: 'text',
    },
    {
        name: CurrentDataFields.weekdays_remaining,
        value: 0,
        label: 'Осталось будних',
        type: 'text',
    },
    {
        name: CurrentDataFields.total_spent_actual,
        value: 0,
        label: 'Всего потрачено',
        type: 'text',
    },
    {
        name: CurrentDataFields.spent_on_weekends,
        value: 0,
        label: 'Потрачено выходные',
        type: 'text',
    },
    {
        name: CurrentDataFields.spent_on_weekdays,
        value: 0,
        label: 'Потрачено будни',
        type: 'text',
    },
    {
        name: CurrentDataFields.total_remaining,
        value: 0,
        label: 'Общий остаток',
        type: 'text',
    },
    {
        name: CurrentDataFields.remaining_for_weekends,
        value: 0,
        label: 'Остаток выходные',
        type: 'text',
    },
    {
        name: CurrentDataFields.remaining_for_weekdays,
        value: 0,
        label: 'Остаток будни',
        type: 'text',
    },
    {
        name: CurrentDataFields.plan_for_today,
        value: 0,
        label: 'План на сегодня',
        type: 'text',
    },
])

</script>

<style lang="scss">
.adaptive-grid {
    display: grid;
    gap: 16px;

    // Мобильная версия - вертикальная компоновка
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr;
    grid-template-areas:
        "source"
        "current"
        "result";

    .grid-item-source {
        grid-area: source;
    }

    .grid-item-current {
        grid-area: current;
    }

    .grid-item-result {
        grid-area: result;
    }

    // Десктопная версия - двухколоночная компоновка
    @media (min-width: 1024px) {
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        grid-template-areas:
            "result source"
            "result current";
    }
}

.card-title-section {

}
</style>
