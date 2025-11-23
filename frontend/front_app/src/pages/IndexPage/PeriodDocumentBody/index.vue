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

                                <TableCell td-key="value" :td-props="props" :cell-type="props.row.cellType"
                                    align-content="right" :cell-format="props.row.cellFormat"
                                    :model-value="initDataModel(props.row.name)"
                                    @update:model-value="(value) => handleUpdateInitDataModel(props.row.name, value)" />
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

                                <TableCell td-key="value" :td-props="props" :cell-type="props.row.cellType"
                                    :cell-format="props.row.cellFormat" align-content="right"
                                    v-model="currentDataCalcValues[props.row.name as keyof PeriodDocCurrentRowValues]" />

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
                        :row-key="PeriodDocCalendarColumn.date_friendly" :rows="calendarRows" dense :rows-per-page="[0]"
                        v-model:pagination="initCurrentPagination" hide-bottom separator="cell">
                        <template #body="props">
                            <q-tr :props="props"
                                :class="{ 'bg-red-2': props.row.date.isWeekend(), 'bg-green-2': props.row.date.isToday() }">
                                <q-td :key="PeriodDocCalendarColumn.date_friendly" :props="props">
                                    {{ props.row.date.friendly }}
                                </q-td>
                                <q-td :key="PeriodDocCalendarColumn.day_of_week" :props="props">
                                    {{ props.row.date.dayOfWeekString }}
                                </q-td>
                                <TableCell :td-key="PeriodDocCalendarColumn.plan" :td-props="props" cell-type="text"
                                    cell-format="currency" align-content="right" :model-value="props.row.plan" />

                                <TableCell :td-key="PeriodDocCalendarColumn.fact" :td-props="props" cell-type="input"
                                    cell-format="currency" align-content="right"
                                    v-model="calendarFactDBValues[props.row.date.friendly]" />

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
    PeriodDocCalendarDataColumns,
    PeriodDocInitAndCurrentDataColumns,
    PeriodDocCurrentDataRows,
    PeriodDocInitDataRows,
    PeriodDocCalendarColumn,
    PeriodDocInitCalcRowValues,
    PeriodDocCurrentRowValues,
    PeriodDocCalendarRow,
} from './models';
import { onMounted, ref, shallowRef, computed, triggerRef } from 'vue';
import { PeriodDocumentDBData, PeriodDocumentMainValuesData } from 'src/models/database';
import { AppDate } from 'src/utils/date';
import { getPeriodDocumentCalendarDataRows } from './funs';
import { PeriodDocInitDataFields, PeriodDocInitDataFieldsMap } from 'src/models/period_doc';
import TableCell from 'src/components/TableCell/index.vue';
import { useDocumentCalendarFactValuesRef, useDocumentMainValuesRef } from 'src/services/database/wrappers/period_docs';

const initCurrentPagination = ref({ rowsPerPage: 0 })

interface Props {
    document: PeriodDocumentDBData
}

const { document } = defineProps<Props>()

const aFromDate = computed(() => AppDate.fromFriendlyFormat(document.from_date))
const aToDate = computed(() => AppDate.fromFriendlyFormat(document.to_date))

const calendarRows = shallowRef<PeriodDocCalendarRow[]>([])  // Строки календаря
const currentDate = ref<AppDate>()  // Текущая дата
const lastCalcDate = ref<AppDate>()  // Последняя дата расчёта плана

const documentMainDBValues = useDocumentMainValuesRef(document)  // Основные значения документа
const calendarFactDBValues = useDocumentCalendarFactValuesRef(document)  // Факты календаря

const initDataCalcValues = ref<PeriodDocInitCalcRowValues>({} as PeriodDocInitCalcRowValues)  // Калькулируемые исходные данные
const currentDataCalcValues = ref<PeriodDocCurrentRowValues>({} as PeriodDocCurrentRowValues)  // Текущие данные

/** Слежение за основными значениями документа */
documentMainDBValues.bindValuesWatcher(async (values) => {
    await recalcDocumentCalcValues(false)  // Пересчёт калькулируемых данных
})

/** Слежение за значениями фактов календаря */
calendarFactDBValues.bindValuesWatcher(async (values) => {
    await recalcCalendarPlansAndCurrentData()  // Пересчёт планов календаря и текущих данных
})

/** Получение модели значения исходных данных */
const initDataModel = computed(() => {
    return function (name: PeriodDocInitDataFieldsMap) {
        if (
            [PeriodDocInitDataFields.total_budget, PeriodDocInitDataFields.weekend_plan].includes(name)
        ) return documentMainDBValues.value[name as keyof PeriodDocumentMainValuesData]
        return initDataCalcValues.value[name as keyof PeriodDocInitCalcRowValues]
    }
})

/** Обновление модели значения исходных данных */
const handleUpdateInitDataModel = (name: PeriodDocInitDataFieldsMap, value: number) => {
    if (
        [PeriodDocInitDataFields.total_budget, PeriodDocInitDataFields.weekend_plan].includes(name)
    ) documentMainDBValues.value[name as keyof PeriodDocumentMainValuesData] = value
    else initDataCalcValues.value[name as keyof PeriodDocInitCalcRowValues] = value
}

onMounted(async () => {
    await initDocument()
})

/** Инициализация данных документа */
const initDocument = async () => {
    await documentMainDBValues.initFromDB()
    await calendarFactDBValues.initFromDB()

    await initDocumentCalcValues()  // Инициализация калькулируемых исходных данных
}

/** Первичная инициализация  */
const initDocumentCalcValues = async () => {
    currentDate.value = AppDate.today()

    if (currentDate.value!.isAfter(aToDate.value)) lastCalcDate.value = aToDate.value
    else if (currentDate.value!.isBefore(aFromDate.value)) lastCalcDate.value = aFromDate.value
    else lastCalcDate.value = currentDate.value

    // Если текущая дата выходит из диапазона, то устанавливаем крайние даты как текущую
    calendarRows.value = getPeriodDocumentCalendarDataRows(document)  // Инициализация строк календаря
    calendarFactDBValues.ignoreValuesUpdates(() => {
        calendarRows.value.forEach(row => {  // Инициализируем факты календаря пустыми значениями (если не заданы)
            if (!Number.isInteger(calendarFactDBValues.value[row.date.friendly])) calendarFactDBValues.value[row.date.friendly] = 0
        })

        // TODO: Удалять факты календаря, которые не входят в диапазон дат документа
        // Не сохраняем в БД до первого обновления фактов
    })

    await recalcDocumentCalcValues(true)
}

/** Пересчёт калькулируемых исходных данных / планов календаря / текущих данных */
const recalcDocumentCalcValues = async (recalcDays: boolean = true) => {
    await recalcInitDataValues(recalcDays)
    await recalcCalendarPlansAndCurrentData()
}

/** Пересчёт калькулируемых исходных данных */
const recalcInitDataValues = async (recalcDays: boolean = true) => {

    initDataCalcValues.value = function (): PeriodDocInitCalcRowValues {
        const totalDays = recalcDays ? calendarRows.value.length : initDataCalcValues.value.total_days
        const weekendDays = recalcDays ? calendarRows.value.filter(row => row.date.isWeekend()).length : initDataCalcValues.value.weekend_days
        const weekdayDays = recalcDays ? calendarRows.value.filter(row => !row.date.isWeekend()).length : initDataCalcValues.value.weekday_days
        const totalWeekendsBudget = weekendDays * documentMainDBValues.value.weekend_plan
        const totalWeekdaysBudget = documentMainDBValues.value.total_budget - totalWeekendsBudget

        return {
            total_days: totalDays,
            weekend_days: weekendDays,
            weekday_days: weekdayDays,
            total_weekends_budget: totalWeekendsBudget,
            total_weekdays_budget: totalWeekdaysBudget,
            initial_plan: Math.round(totalWeekdaysBudget / weekdayDays),
        }
    }()
}

/** Пересчёт планов календаря и текущих данных */
const recalcCalendarPlansAndCurrentData = async () => {
    /** Счётчик оставшихся дней относительно индекса переданнной даты */
    function countRemainingDays(index: number, isWeekend: boolean) {
        return calendarRows.value.slice(index).filter(day => day.date.isWeekend() === isWeekend).length;
    }

    /** Считает сумму фактов до переданного индекса даты */
    function sumFact(upToIndex: number) {
        return calendarRows.value.slice(0, upToIndex).reduce((acc, row) => acc + calendarFactDBValues.value[row.date.friendly]!, 0);
    }

    calendarRows.value[0]!.plan = initDataCalcValues.value.initial_plan // План первого дня
    let lastCalcPlan = initDataCalcValues.value.initial_plan  // Последний рассчитанный план

    /** Заполенение плана до текущей даты */
    for (let i = 1; i < calendarRows.value.length; i++) {
        const row = calendarRows.value[i]!
        if (row.date.isAfter(currentDate.value!)) {  // День после текущей даты
            // В выходные - план выходного дня, в будни - последний рассчитанный план
            row.plan = row.date.isWeekend() ? documentMainDBValues.value.weekend_plan : lastCalcPlan
            continue
        }

        const remainingWeekends = countRemainingDays(i, true)  // Осталось выходных дней
        const remainingWeekdays = countRemainingDays(i, false)  // Осталось будних дней
        const spentSoFar = sumFact(i)  // Потрачено до текущей даты

        // Рассчитываем план на сегодня (в том числе для выходных - для корректного расчёта последнего плана)
        lastCalcPlan = remainingWeekdays > 0 ? Math.round(
            // (Изначальный план - потрачено всего до сегодня - план на оставшиеся выходные) / оставшиеся будни
            (documentMainDBValues.value.total_budget - spentSoFar - (remainingWeekends * documentMainDBValues.value.weekend_plan)) / remainingWeekdays
        ) : 0

        // Проставляем план (если выходной - план выходного дня)
        row.plan = row.date.isWeekend() ? documentMainDBValues.value.weekend_plan : lastCalcPlan
    }

    triggerRef(calendarRows)  // Тригер обновления строк календаря

    /** Индекс текущей даты */
    const lastCalcDateIndex = calendarRows.value.findIndex(row => row.date.iso === lastCalcDate.value!.iso)
    if (lastCalcDateIndex === -1) {
        // TODO: Что делать в таком случае?
        // Такого быть не должно
        throw new Error('Current date not found in calendar rows')
    }

    /** Текущие данные */
    currentDataCalcValues.value = function (): PeriodDocCurrentRowValues {
        const daysRemaining = aToDate.value.diff(currentDate.value!) + 1 // Осталось дней (включая текущий день)
        const weekendsRemaining = countRemainingDays(lastCalcDateIndex, true)  // Осталось выходных дней
        const weekdaysRemaining = daysRemaining - weekendsRemaining // Осталось будних дней

        const totalSpent = sumFact(lastCalcDateIndex)  // Всего потрачено
        const spentOnWeekends = calendarRows.value.filter(  // Потрачено в выходные
            row => row.date.isWeekend()).reduce((acc, row) => acc + calendarFactDBValues.value[row.date.friendly]!, 0
            )
        const spentOnWeekdays = totalSpent - spentOnWeekends  // Потрачено в будние

        const totalRemaining = documentMainDBValues.value.total_budget - totalSpent  // Обший остаток
        const remainingForWeekends = (  // Отсалось на выходные (не больше общего остатка)
            weekendsRemaining * documentMainDBValues.value.weekend_plan
        ) > totalRemaining ? totalRemaining : (weekendsRemaining * documentMainDBValues.value.weekend_plan)
        const remainingForWeekdays = totalRemaining - remainingForWeekends  // Отсалось на будни

        return {
            current_date: currentDate.value!.friendly,
            days_remaining: daysRemaining,
            weekends_remaining: weekendsRemaining,
            weekdays_remaining: weekdaysRemaining,
            total_spent_actual: totalSpent,
            spent_on_weekends: spentOnWeekends,
            spent_on_weekdays: spentOnWeekdays,
            total_remaining: totalRemaining,
            remaining_for_weekends: remainingForWeekends,
            remaining_for_weekdays: remainingForWeekdays,
            plan_for_today: lastCalcPlan,
        }
    }()
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
