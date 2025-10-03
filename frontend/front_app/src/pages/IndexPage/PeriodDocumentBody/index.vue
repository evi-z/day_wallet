<template>
    <div class="page-container">
        <!-- Исходные данные -->
        <div class="grid-item-source">
            <q-card class="full-height">
                <q-card-section class="card-title-section">
                    <div class="text-subtitle1 card-title-text">Исходные данные</div>
                </q-card-section>
                <!-- <q-separator></q-separator> -->
                <q-card-section class="no-padding card-table-section">
                    <q-table square flat class="full-height page-table" :columns="PeriodDocInitAndCurrentDataColumns"
                        :rows="PeriodDocInitDataRows" hide-header dense :rows-per-page="[0]" row-key="name"
                        v-model:pagination="initCurrentPagination" hide-bottom separator="cell">
                        <template #body="props">

                            <q-tr :props="props">
                                <q-td key="label" :props="props">
                                    {{ props.row.label }}
                                </q-td>
                                <template v-if="props.row.type === PeriodDocInitAndCurrentCellType.text">
                                    <q-td key="value" :props="props">
                                        {{ initDataValues[props.row.name as keyof PeriodDocInitRowValues] }}
                                    </q-td>
                                </template>
                                <template v-else-if="props.row.type === PeriodDocInitAndCurrentCellType.input">
                                    <TableInputCell td-key="value" :td-props="props"
                                        v-model="initDataValues[props.row.name as keyof PeriodDocInitRowValues]" />
                                </template>

                                <!-- <q-td key="value" :props="props"
                                    :class="{ 'no-padding': props.row.type === PeriodDocInitAndCurrentCellType.input }">
                                    <template v-if="props.row.type === PeriodDocInitAndCurrentCellType.text">
                                        {{ initDataValues[props.row.name as keyof PeriodDocInitRowValues] }}
                                    </template>
                                    <template v-else-if="props.row.type === PeriodDocInitAndCurrentCellType.input">
                                        <q-input borderless input-class="text-right q-px-md q-py-none" input-style="font-size: 13px;" dense
                                            v-model="initDataValues[props.row.name as keyof PeriodDocInitRowValues]" />
                                    </template>
                                </q-td> -->
                            </q-tr>

                        </template>
                    </q-table>
                </q-card-section>
            </q-card>
        </div>

        <!-- Текущие данные -->
        <div class="grid-item-current">
            <q-card class="full-height">
                <q-card-section class="card-title-section">
                    <div class="text-subtitle1 card-title-text">Текущие данные</div>
                </q-card-section>
                <!-- <q-separator></q-separator> -->
                <q-card-section class="no-padding card-table-section">
                    <q-table square flat class="full-height page-table" :columns="PeriodDocInitAndCurrentDataColumns"
                        :rows="PeriodDocCurrentDataRows" hide-header dense :rows-per-page="[0]" row-key="name"
                        v-model:pagination="initCurrentPagination" hide-bottom separator="cell">
                        <template #body="props">
                            <q-tr :props="props">
                                <q-td key="label" :props="props">
                                    {{ props.row.label }}
                                </q-td>
                                <q-td key="value" :props="props">
                                    <template v-if="props.row.type === PeriodDocInitAndCurrentCellType.text">
                                        {{ currentDataValues[props.row.name as keyof PeriodDocCurrentRowValues] }}
                                    </template>
                                    <template v-else-if="props.row.type === PeriodDocInitAndCurrentCellType.input">
                                        <q-input
                                            v-model="currentDataValues[props.row.name as keyof PeriodDocCurrentRowValues]" />
                                    </template>
                                </q-td>
                            </q-tr>
                        </template>
                    </q-table>
                </q-card-section>
            </q-card>
        </div>

        <!-- Результат -->
        <div class="grid-item-result">
            <q-card class="full-height">
                <q-card-section class="card-title-section">
                    <div class="text-subtitle1 card-title-text">
                        <span>Календарь</span>
                        <q-space />
                        <div class="row items-center q-gutter-x-sm q-pr-sm">
                            <q-btn icon="calendar_month" flat round @click="handleEdit" />
                        </div>
                    </div>
                </q-card-section>
                <q-card-section class="no-padding card-table-section">
                    <q-table square flat class="full-height page-table" :columns="PeriodDocCalendarDataColumns"
                        :row-key="PeriodDocCalendarColumn.date_friendly" :rows="calendarDataRows" dense :rows-per-page="[0]"
                        v-model:pagination="initCurrentPagination" hide-bottom separator="cell">
                        <template #body="props">
                            <q-tr :props="props" :class="{ 'bg-red-2': props.row.date.isWeekend() }">
                                <q-td :key="PeriodDocCalendarColumn.date_friendly" :props="props">
                                    {{ props.row.date_friendly }}
                                </q-td>
                                <q-td :key="PeriodDocCalendarColumn.day_of_week" :props="props">
                                    {{ props.row.day_of_week }}
                                </q-td>
                                <q-td :key="PeriodDocCalendarColumn.plan" :props="props">
                                    {{ props.row.plan }}
                                </q-td>
                                <q-td :key="PeriodDocCalendarColumn.fact" :props="props">
                                    {{ props.row.fact }}
                                </q-td>
                            </q-tr>
                        </template>
                    </q-table>
                </q-card-section>
            </q-card>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    PeriodDocCalendarDataColumns, PeriodDocInitAndCurrentDataColumns, PeriodDocCurrentDataRows, PeriodDocInitDataRows, PeriodDocCalendarColumn,
    PeriodDocInitAndCurrentCellType,
    PeriodDocInitRowValues,
    PeriodDocCurrentRowValues,
    PeriodDocCalendarRow,
    PeriodDocCalendarRowValues
} from './models';
import { customRef, onMounted, ref, shallowRef, toRefs, watchEffect } from 'vue';
import { PeriodDocumentDBData } from 'src/models/database';
import { AppDate } from 'src/utils/date';
import TableInputCell from './TableInputCell.vue';
import { getDaysInPeriodDocument, getPeriodDocumentCalendarDataRows } from './funs';

const initCurrentPagination = ref({ rowsPerPage: 0 })

interface Props {
    document: PeriodDocumentDBData
}

const props = defineProps<Props>()

const { document } = props



const calendarDataRows = shallowRef<PeriodDocCalendarRow[]>([])
const today = ref<AppDate | null>(null)

onMounted(async () => {
    today.value = AppDate.today()
    initDocumentValues()
})

type InitValuesDef = Pick<PeriodDocInitRowValues, 'total_budget' | 'weekend_plan'>
const InitValuesDef: InitValuesDef = {
    total_budget: 40000,
    weekend_plan: 2000,
}

const initDataValues = ref<PeriodDocInitRowValues>({})
const currentDataValues = ref<PeriodDocCurrentRowValues>({})


const useDocumentRefs = (
    { document, currentDate, initValues, calendarValues }: {
        document: PeriodDocumentDBData,
        currentDate: AppDate,
        initValues: InitValuesDef,
        calendarValues: PeriodDocCalendarRowValues,
    }
) => {
    const calendarRows = getPeriodDocumentCalendarDataRows(document)  // Строки календаря
    const calendarValuesRef = shallowRef<PeriodDocCalendarRowValues>()  // Значения календаря

    const initValuesRef = shallowRef<PeriodDocInitRowValues>(function (): PeriodDocInitRowValues {
        const weekendDays = calendarRows.filter(row => row._date.isWeekend()).length
        const weekdayDays = calendarRows.filter(row => !row._date.isWeekend()).length
        const totalWeekendsBudget = weekendDays * initValues.weekend_plan
        const totalWeekdaysBudget = initValues.total_budget - totalWeekendsBudget

        return {
            ...initValues,
            total_days: calendarRows.length,
            weekend_days: weekendDays,
            weekday_days: weekdayDays,
            total_weekends_budget: totalWeekendsBudget,
            total_weekdays_budget: totalWeekdaysBudget,
            initial_plan: Math.round(totalWeekdaysBudget / weekdayDays),
        }
    }())
    const currentValuesRef = shallowRef<PeriodDocCurrentRowValues>(function (): PeriodDocCurrentRowValues {
        return {
            current_date: currentDate.friendly,
            days_remaining: calendarRows.length,
            weekends_remaining: calendarRows.filter(row => row._date.isWeekend()).length,
            weekdays_remaining: calendarRows.filter(row => !row._date.isWeekend()).length,
        }
    }())


    watchEffect(() => {
        console.log(currentDate, initValuesRef.value)
    })

    return {
        initValuesRef,
        currentValuesRef,
        calendarValuesRef
    }
}

const initDocumentValues = () => {
    const { initValuesRef, currentValuesRef, calendarValuesRef } = useDocumentRefs({
        document: document,
        currentDate: today.value,
        initValues: InitValuesDef,
    })

    initDataValues.value = initValuesRef.value
    currentDataValues.value = currentValuesRef.value
    calendarDataRows.value = calendarValuesRef.value
}


const handleEdit = () => {
    console.log('handleEdit')
}





</script>

<style lang="scss" scoped>
.page-container {
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

    .card-title-section {
        height: 50px;
        padding: 0;

        .card-title-text {
            height: 100%;
            display: flex;
            flex-direction: row;
            align-items: center;
            padding-left: 16px;
        }
    }

    .card-table-section {
        height: calc(100% - 50px);

        .page-table {
            border-top: 1px solid $table-border-color;
            border-bottom-left-radius: $generic-border-radius;
            border-bottom-right-radius: $generic-border-radius;

            :deep(tr:last-child td) {
                border-bottom: 1px solid $table-border-color;
            }
        }
    }
}
</style>
