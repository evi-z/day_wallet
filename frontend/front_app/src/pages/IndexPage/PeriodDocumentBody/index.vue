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
                                        {{ initDataValues[props.row.name as keyof PeriodDocInitCalcRowValues] }}
                                    </q-td>
                                </template>
                                <template v-else-if="props.row.type === PeriodDocInitAndCurrentCellType.input">
                                    <TableInputCell td-key="value" :td-props="props"
                                        :model-value="initDataModel(props.row.name)"
                                        @update:model-value="(value) => handleUpdateInitDataModel(props.row.name, value)" />
                                </template>

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
                                <template v-if="props.row.type === PeriodDocInitAndCurrentCellType.text">
                                    <q-td key="value" :props="props">
                                        {{ currentDataValues[props.row.name as keyof PeriodDocCurrentRowValues] }}
                                    </q-td>
                                </template>
                                <template v-else-if="props.row.type === PeriodDocInitAndCurrentCellType.input">
                                    <TableInputCell td-key="value" :td-props="props"
                                        v-model="currentDataValues[props.row.name as keyof PeriodDocCurrentRowValues]" />
                                </template>
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
                                <q-td :key="PeriodDocCalendarColumn.plan" :props="props">
                                    {{ props.row.plan }}
                                </q-td>

                                <TableInputCell :td-key="PeriodDocCalendarColumn.fact" :td-props="props"
                                    v-model="calendarFactValues[props.row.date.friendly]" />

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
    PeriodDocInitCalcRowValues,
    PeriodDocCurrentRowValues,
    PeriodDocCalendarRow,
    DefaultPeriodDocumentMainValues,
} from './models';
import { onMounted, ref, shallowRef, computed, nextTick, triggerRef } from 'vue';
import { PeriodDocumentCalendarFactValuesDBData, PeriodDocumentDBData, PeriodDocumentMainValuesData, PeriodDocumentMainValuesDBData } from 'src/models/database';
import { AppDate } from 'src/utils/date';
import TableInputCell from './TableInputCell.vue';
import { getPeriodDocumentCalendarDataRows } from './funs';
import app from 'src/services/app';
import { watchPausable } from '@vueuse/core';
import { PeriodDocInitDataFields, PeriodDocInitDataFieldsMap } from 'src/models/period_doc';

const initCurrentPagination = ref({ rowsPerPage: 0 })

interface Props {
    document: PeriodDocumentDBData
}

const props = defineProps<Props>()

const { document } = props
const aFromDate = computed(() => AppDate.fromFriendlyFormat(document.from_date))
const aToDate = computed(() => AppDate.fromFriendlyFormat(document.to_date))

const calendarRows = shallowRef<PeriodDocCalendarRow[]>([])  // Строки календаря
const currentDate = ref<AppDate>()  // Текущая дата

const documentMainValues = ref<PeriodDocumentMainValuesDBData>({} as PeriodDocumentMainValuesDBData)  // Основные значения документа
const initDataValues = ref<PeriodDocInitCalcRowValues>({} as PeriodDocInitCalcRowValues)  // Калькулируемые исходные данные
const currentDataValues = ref<PeriodDocCurrentRowValues>({} as PeriodDocCurrentRowValues)  // Текущие данные
const calendarFactValues = ref<PeriodDocumentCalendarFactValuesDBData>({} as PeriodDocumentCalendarFactValuesDBData)  // Факты календаря

/** Сохранение основных значений документа в БД (с обновлением ревизии) */
const updateMainValuesInDB = async () => {
    console.log('UPD Before Main Values', documentMainValues.value._rev)
    return app.userDb!.setPeriodDocumentMainValues(document._id, documentMainValues.value).then(async res => {
        await updateDocumentMainValuesWithoutWatcher(async () => {
            Object.assign(documentMainValues.value, { _rev: res.rev })
            console.log('UPD Main Values', documentMainValues.value._rev)
        })
    })
}

/** Сохранение значений фактов календаря в БД (с обновлением ревизии) */
const updateCalendarFactValuesInDB = async () => {
    console.log('UPD Before Fact Values', calendarFactValues.value._rev)
    return app.userDb!.setPeriodDocumentCalendarFactValues(document._id, calendarFactValues.value).then(async res => {

        await updateCalendarFactValuesWithoutWatcher(async () => {
            Object.assign(calendarFactValues.value, { _rev: res.rev })
            console.log('UPD Fact Values', calendarFactValues.value._rev)
        })
    })
}

/** Наблюдатель за значениями "Общий бюджет" и "План на выходные" */
const initDataMainValuesWatcher = watchPausable(() => [
    documentMainValues.value.total_budget, documentMainValues.value.weekend_plan
], async ([totalBudget, weekendPlan]) => {
    await nextTick()
    await recalcDocumentCalcValues(false)  // Пересчёт калькулируемых данных
    // Сохранение основных значений документа в БД (TODO: Сделать частичное обновление)
    await updateMainValuesInDB()
})

/** Наблюдатель за значениями фактов календаря */
const calendarFactDataValuesWatcher = watchPausable(calendarFactValues, async (val) => {
    console.log('calendarFactDataValuesWatcher')
    await nextTick()
    await recalcCalendarPlansAndCurrentData()
    // Сохранение значений фактов календаря в БД (TODO: Сделать частичное обновление)
    await updateCalendarFactValuesInDB()
}, { deep: true })

/** Получение модели значения исходных данных */
const initDataModel = computed(() => {
    return function (name: PeriodDocInitDataFieldsMap) {
        if (
            [PeriodDocInitDataFields.total_budget, PeriodDocInitDataFields.weekend_plan].includes(name)
        ) return documentMainValues.value[name as keyof PeriodDocumentMainValuesData]
        return initDataValues.value[name as keyof PeriodDocInitCalcRowValues]
    }
})

/** Обновление модели значения исходных данных */
const handleUpdateInitDataModel = (name: PeriodDocInitDataFieldsMap, value: number) => {
    if (
        [PeriodDocInitDataFields.total_budget, PeriodDocInitDataFields.weekend_plan].includes(name)
    ) documentMainValues.value[name as keyof PeriodDocumentMainValuesData] = value
    else initDataValues.value[name as keyof PeriodDocInitCalcRowValues] = value
}

onMounted(async () => {
    await initDocument()
})

/** Установка основных значений документа без запуска наблюдателей */
const updateDocumentMainValuesWithoutWatcher = async (fn: () => Promise<void>) => {
    initDataMainValuesWatcher.pause()
    await nextTick()
    await fn()
    await nextTick()
    initDataMainValuesWatcher.resume()
}

/** Получение основных значений документа из БД */
const initDocumentMainValuesFromDB = async () => {
    let mainValues = await app.userDb!.fetchPeriodDocumentMainValues(document._id)
    if (!mainValues) {  // Если нет основных значений, то создаём их
        await app.userDb!.setPeriodDocumentMainValues(document._id, DefaultPeriodDocumentMainValues).then(async res => {
            mainValues = await app.userDb!.getByIdOrNull<PeriodDocumentMainValuesDBData>(res.id)
        })
    }

    await updateDocumentMainValuesWithoutWatcher(async () => {
        documentMainValues.value = mainValues!
        console.log('INIT Main Values', documentMainValues.value._rev)
    })
}

/** Обновление основных значений документа без запуска наблюдателей */
const updateCalendarFactValuesWithoutWatcher = async (fn: () => Promise<void>) => {
    calendarFactDataValuesWatcher.pause()
    await nextTick()
    await fn()
    await nextTick()
    calendarFactDataValuesWatcher.resume()
}

/** Получение значений фактов календаря из БД */
const initDocumentCalendarFactValuesFromDB = async () => {
    let calendarFactVal = await app.userDb!.fetchPeriodDocumentCalendarFactValues(document._id)

    if (!calendarFactVal) {  // Если нет значений фактов календаря, то создаём их (пустыми, для инициализации id в БД)
        await app.userDb!.setPeriodDocumentCalendarFactValues(document._id, {}).then(async res => {
            calendarFactVal = await app.userDb!.getByIdOrNull<PeriodDocumentCalendarFactValuesDBData>(res.id)
        })
    }

    await updateCalendarFactValuesWithoutWatcher(async () => {
        calendarFactValues.value = calendarFactVal!
        console.log('INIT Fact Values', calendarFactValues.value._rev)
    })
}

/** Инициализация данных документа */
const initDocument = async () => {
    await initDocumentMainValuesFromDB()  // Инициализация основных значений документа из БД
    await initDocumentCalendarFactValuesFromDB()  // Инициализация значений фактов календаря из БД
    await initDocumentCalcValues()  // Инициализация калькулируемых исходных данных
}

/** Первичная инициализация  */
const initDocumentCalcValues = async () => {
    currentDate.value = AppDate.today()

    // Если текущая дата выходит из диапазона, то устанавливаем крайние даты как текущую
    if (currentDate.value!.isAfter(aToDate.value)) currentDate.value = aToDate.value
    if (currentDate.value!.isBefore(aFromDate.value)) currentDate.value = aFromDate.value


    calendarRows.value = getPeriodDocumentCalendarDataRows(document)  // Инициализация строк календаря
    await updateCalendarFactValuesWithoutWatcher(async () => {
        calendarRows.value.forEach(row => {  // Инициализируем факты календаря пустыми значениями (если не заданы)
            if (!Number.isInteger(calendarFactValues.value[row.date.friendly])) calendarFactValues.value[row.date.friendly] = 0
        })
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

    initDataValues.value = function (): PeriodDocInitCalcRowValues {
        const totalDays = recalcDays ? calendarRows.value.length : initDataValues.value.total_days
        const weekendDays = recalcDays ? calendarRows.value.filter(row => row.date.isWeekend()).length : initDataValues.value.weekend_days
        const weekdayDays = recalcDays ? calendarRows.value.filter(row => !row.date.isWeekend()).length : initDataValues.value.weekday_days
        const totalWeekendsBudget = weekendDays * documentMainValues.value.weekend_plan
        const totalWeekdaysBudget = documentMainValues.value.total_budget - totalWeekendsBudget

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
        return calendarRows.value.slice(0, upToIndex).reduce((acc, row) => acc + calendarFactValues.value[row.date.friendly]!, 0);
    }

    calendarRows.value[0]!.plan = initDataValues.value.initial_plan // План первого дня
    let lastCalcPlan = initDataValues.value.initial_plan  // Последний рассчитанный план

    /** Заполенение плана до текущей даты */
    for (let i = 1; i < calendarRows.value.length; i++) {
        const row = calendarRows.value[i]!

        // Будни после текущей даты - план последнего рассчитанного дня
        if (row.date.isAfter(currentDate.value!)) {
            row.plan = lastCalcPlan
            continue
        }

        const remainingWeekends = countRemainingDays(i, true)  // Осталось выходных дней
        const remainingWeekdays = countRemainingDays(i, false)  // Осталось будних дней
        const spentSoFar = sumFact(i)  // Потрачено до текущей даты

        // Рассчитываем план на сегодня
        lastCalcPlan = remainingWeekends > 0 ? Math.round(
            // (Изначальный план - потрачено всего до сегодня - план на оставшиеся выходные) / оставшиеся будни
            (documentMainValues.value.total_budget - spentSoFar - (remainingWeekends * documentMainValues.value.weekend_plan)) / remainingWeekdays
        ) : 0

        // Проставляем план (если выходной - план выходного дня)
        row.plan = row.date.isWeekend() ? documentMainValues.value.weekend_plan : lastCalcPlan
    }

    triggerRef(calendarRows)  // Тригер обновления строк календаря

    /** Индекс текущей даты */
    const currentDayIndex = calendarRows.value.findIndex(row => row.date.iso === currentDate.value!.iso)
    if (currentDayIndex === -1) {
        // TODO: Что делать в таком случае?
        // Такого быть не должно
        throw new Error('Current date not found in calendar rows')
    }

    /** Текущие данные */
    currentDataValues.value = function (): PeriodDocCurrentRowValues {
        const daysRemaining = aToDate.value.diff(currentDate.value!) + 1 // Осталось дней (включая текущий день)
        const weekendsRemaining = countRemainingDays(currentDayIndex, true)  // Осталось выходных дней
        const weekdaysRemaining = daysRemaining - weekendsRemaining // Осталось будних дней

        const totalSpent = sumFact(currentDayIndex)  // Всего потрачено
        const spentOnWeekends = calendarRows.value.filter(  // Потрачено в выходные
            row => row.date.isWeekend()).reduce((acc, row) => acc + calendarFactValues.value[row.date.friendly]!, 0
            )
        const spentOnWeekdays = totalSpent - spentOnWeekends  // Потрачено в будние

        const totalRemaining = documentMainValues.value.total_budget - totalSpent  // Обший остаток
        const remainingForWeekends = (  // Отсалось на выходные (не больше общего остатка)
            weekendsRemaining * documentMainValues.value.weekend_plan
        ) > totalRemaining ? totalRemaining : (weekendsRemaining * documentMainValues.value.weekend_plan)
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
