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
import { onBeforeUnmount, onMounted, ref, shallowRef, computed, triggerRef } from 'vue';
import { PeriodDocumentDBData, PeriodDocumentMainValuesData } from 'src/models/database';
import { AppDate } from 'src/utils/date';
import { getPeriodDocumentCalendarDataRows } from './funs';
import { PeriodDocInitDataFields, PeriodDocInitDataFieldsMap } from 'src/models/period_doc';
import TableCell from 'src/components/TableCell/index.vue';
import { useDocumentCalendarFactValuesRef, useDocumentMainValuesRef } from 'src/services/database/wrappers/period_docs';
import { calculatePeriod } from 'src/domain/period_calc';

const initCurrentPagination = ref({ rowsPerPage: 0 })

interface Props {
    document: PeriodDocumentDBData
}

const { document } = defineProps<Props>()

const calendarRows = shallowRef<PeriodDocCalendarRow[]>([])  // Строки календаря
const currentDate = ref<AppDate>(AppDate.today())  // Текущая дата

const documentMainDBValues = useDocumentMainValuesRef(document)  // Основные значения документа
const calendarFactDBValues = useDocumentCalendarFactValuesRef(document)  // Факты календаря

const initDataCalcValues = ref<PeriodDocInitCalcRowValues>({} as PeriodDocInitCalcRowValues)  // Калькулируемые исходные данные
const currentDataCalcValues = ref<PeriodDocCurrentRowValues>({} as PeriodDocCurrentRowValues)  // Текущие данные

/** Слежение за основными значениями документа */
documentMainDBValues.bindValuesWatcher(async () => {
    recalcDocumentCalcValues()
})

/** Слежение за значениями фактов календаря */
calendarFactDBValues.bindValuesWatcher(async () => {
    recalcDocumentCalcValues()
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

let dateCheckTimer: number | undefined

onMounted(async () => {
    await initDocument()

    // Дата и расчёт обновляются при возврате во вкладку и при наступлении нового дня
    dateCheckTimer = window.setInterval(refreshDateIfNeeded, 60_000)
    window.document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
    if (dateCheckTimer) window.clearInterval(dateCheckTimer)
    window.document.removeEventListener('visibilitychange', handleVisibilityChange)
})

/** Инициализация данных документа */
const initDocument = async () => {
    await documentMainDBValues.initFromDB()
    await calendarFactDBValues.initFromDB()

    initCalendarRows()  // Инициализация строк календаря
    initCalendarFacts()  // Пустые факты для дней, где значение ещё не задано
    recalcDocumentCalcValues()
}

/** Строки календаря из дат документа */
const initCalendarRows = () => {
    calendarRows.value = getPeriodDocumentCalendarDataRows(document)
}

/** Инициализируем факты календаря пустыми значениями (если не заданы) */
const initCalendarFacts = () => {
    calendarFactDBValues.ignoreValuesUpdates(() => {
        calendarRows.value.forEach(row => {
            const value = calendarFactDBValues.value[row.date.friendly]
            // Дробные значения (копейки) нельзя обнулять: проверяем число, а не целое
            if (typeof value !== 'number' || !Number.isFinite(value)) {
                calendarFactDBValues.value[row.date.friendly] = 0
            }
        })

        // TODO: Удалять факты календаря, которые не входят в диапазон дат документа
        // Не сохраняем в БД до первого обновления фактов
    })
}

/** Пересчёт исходных данных, планов календаря и текущих данных */
const recalcDocumentCalcValues = () => {
    const facts: Record<string, number | undefined> = {}
    calendarRows.value.forEach(row => {
        facts[row.date.friendly] = calendarFactDBValues.value[row.date.friendly]
    })

    const result = calculatePeriod({
        days: calendarRows.value.map(row => ({
            iso: row.date.iso,
            friendly: row.date.friendly,
            isWeekend: row.date.isWeekend(),
        })),
        budget: documentMainDBValues.value.total_budget,
        weekendPlan: documentMainDBValues.value.weekend_plan,
        facts,
        todayIso: currentDate.value.iso,
    })

    result.plans.forEach((plan, index) => {
        const row = calendarRows.value[index]
        if (row) row.plan = plan
    })
    triggerRef(calendarRows)

    const summary = result.summary

    initDataCalcValues.value = {
        total_days: summary.totalDays,
        weekend_days: summary.weekendDays,
        weekday_days: summary.weekdayDays,
        total_weekends_budget: summary.totalWeekendsBudget,
        total_weekdays_budget: summary.totalWeekdaysBudget,
        initial_plan: summary.initialPlan,
    }

    currentDataCalcValues.value = {
        current_date: currentDate.value.friendly,
        days_remaining: summary.daysRemaining,
        weekends_remaining: summary.weekendsRemaining,
        weekdays_remaining: summary.weekdaysRemaining,
        total_spent_actual: summary.spentTotal,
        spent_on_weekends: summary.spentOnWeekends,
        spent_on_weekdays: summary.spentOnWeekdays,
        total_remaining: summary.totalRemaining,
        remaining_for_weekends: summary.remainingForWeekends,
        remaining_for_weekdays: summary.remainingForWeekdays,
        plan_for_today: summary.planForToday,
        spent_today: summary.spentToday,
        remaining_today: summary.remainingToday,
    }
}

/** Пересчитывает период, если наступил новый день */
const refreshDateIfNeeded = () => {
    const today = AppDate.today()
    if (today.iso === currentDate.value.iso) return

    currentDate.value = today
    recalcDocumentCalcValues()
}

const handleVisibilityChange = () => {
    if (!window.document.hidden) refreshDateIfNeeded()
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
