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
                            <q-btn icon="calendar_month" flat round dense size="sm" @click="handleEdit" />
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
        <!-- Редактирование периода -->
        <q-dialog v-model="editState.open">
            <q-card class="edit-period-card">
                <q-card-section class="text-subtitle1">Период</q-card-section>
                <q-card-section class="q-gutter-y-md column">
                    <q-input v-model="editState.name" outlined dense label="Название периода" :maxlength="22" />
                    <div class="row q-gutter-sm">
                        <q-input class="col" v-model="editState.period.from" outlined dense readonly label="С">
                            <template #append>
                                <q-icon name="event" class="cursor-pointer">
                                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                        <q-date v-model="editState.period.from" mask="DD.MM.YYYY" />
                                    </q-popup-proxy>
                                </q-icon>
                            </template>
                        </q-input>
                        <q-input class="col" v-model="editState.period.to" outlined dense readonly label="По">
                            <template #append>
                                <q-icon name="event" class="cursor-pointer">
                                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                        <q-date v-model="editState.period.to" mask="DD.MM.YYYY" />
                                    </q-popup-proxy>
                                </q-icon>
                            </template>
                        </q-input>
                    </div>
                    <div v-if="editRangeInvalid" class="text-caption text-negative">
                        Дата начала позже даты конца.
                    </div>
                    <div v-if="editFactsOutside.count > 0" class="text-caption text-orange-9">
                        За новыми границами останется {{ editFactsOutside.count }} записей на
                        {{ formatMoney(editFactsOutside.total) }}. Они сохранятся и вернутся,
                        если расширить период.
                    </div>
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat label="Отмена" v-close-popup />
                    <q-btn color="primary" label="Сохранить" :loading="editState.saving" :disable="!editCanSave"
                        @click="handleSaveEdit" />
                </q-card-actions>
            </q-card>
        </q-dialog>
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
import { onBeforeUnmount, onMounted, ref, shallowRef, computed, triggerRef, reactive, watch } from 'vue';
import { PeriodDocumentDBData, PeriodDocumentMainValuesData } from 'src/models/database';
import { AppDate } from 'src/utils/date';
import { getPeriodDocumentCalendarDataRows } from './funs';
import { PeriodDocInitDataFields, PeriodDocInitDataFieldsMap } from 'src/models/period_doc';
import TableCell from 'src/components/TableCell/index.vue';
import { useDocumentCalendarFactValuesRef, useDocumentMainValuesRef } from 'src/services/database/wrappers/period_docs';
import { calculatePeriod } from 'src/domain/period_calc';
import { PeriodCalendarModel } from 'src/components/PeriodCalendar/models';
import { useQuasar } from 'quasar';
import app from 'src/services/app';

const initCurrentPagination = ref({ rowsPerPage: 0 })

interface Props {
    document: PeriodDocumentDBData
}

const { document } = defineProps<Props>()

const emit = defineEmits<{ updated: [] }>()
const $q = useQuasar()

/** Состояние диалога редактирования периода */
const editState = reactive({
    open: false,
    saving: false,
    name: '',
    period: { from: '', to: '' } as PeriodCalendarModel,
})

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


/** Открывает диалог редактирования названия и границ периода */
const handleEdit = () => {
    editState.name = document.name
    editState.period = { from: document.from_date, to: document.to_date }
    editState.open = true
}

const editRangeInvalid = computed(() => {
    const { from, to } = editState.period || { from: '', to: '' }
    if (!from || !to) return false
    return AppDate.fromFriendlyFormat(from).iso > AppDate.fromFriendlyFormat(to).iso
})

const editCanSave = computed(() => {
    return !!(editState.name.trim() && editState.period.from && editState.period.to && !editRangeInvalid.value)
})

/** Факты, которые окажутся за новыми границами периода */
const editFactsOutside = computed(() => {
    const { from, to } = editState.period || { from: '', to: '' }
    if (!from || !to) return { count: 0, total: 0 }

    const fromIso = AppDate.fromFriendlyFormat(from).iso
    const toIso = AppDate.fromFriendlyFormat(to).iso

    let count = 0
    let total = 0
    for (const [friendly, value] of Object.entries(calendarFactDBValues.value)) {
        if (!value) continue
        const iso = AppDate.fromFriendlyFormat(friendly).iso
        if (iso < fromIso || iso > toIso) {
            count++
            total += value
        }
    }

    return { count, total: Math.round(total * 100) / 100 }
})

const formatMoney = (value: number) => {
    return Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 2,
    }).format(value)
}

const handleSaveEdit = async () => {
    if (!editCanSave.value) return

    editState.saving = true
    try {
        await app.userDb!.updatePeriodDocument(document, {
            name: editState.name.trim(),
            from_date: editState.period.from,
            to_date: editState.period.to,
        })
        editState.open = false
        emit('updated')
        $q.notify({ type: 'positive', message: 'Период обновлён' })
    } catch (error) {
        console.error('Error updating period document:', error)
        $q.notify({ type: 'negative', message: 'Не удалось сохранить период' })
    } finally {
        editState.saving = false
    }
}

/** Перестраивает календарь, если у документа изменились границы */
watch(() => [document.from_date, document.to_date], () => {
    initCalendarRows()
    initCalendarFacts()
    recalcDocumentCalcValues()
})

</script>

<style lang="scss" scoped>
.edit-period-card {
    width: 360px;
    max-width: 92vw;
}

.page-container {
    display: grid;
    gap: 8px;
    height: 100%;
    min-height: 0;

    // Мобильная версия - вертикальная компоновка
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto minmax(320px, 1fr);
    grid-template-areas:
        "source"
        "current"
        "result";

    .grid-item-source,
    .grid-item-current,
    .grid-item-result {
        min-width: 0;
        min-height: 0;
    }

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
        grid-template-columns: minmax(0, 1fr) 320px;
        grid-template-rows: auto minmax(0, 1fr);
        grid-template-areas:
            "result source"
            "result current";
    }

    @media (min-width: 1440px) {
        grid-template-columns: minmax(0, 1fr) 360px;
    }

    // На телефоне данные показываем целиком, а календарь оставляем
    // прокручиваемой областью фиксированной высоты.
    @media (max-width: 1023px) {
        height: auto;
        grid-template-rows: auto auto auto;
        grid-template-areas:
            "result"
            "current"
            "source";

        .grid-item-result {
            height: 56vh;
            min-height: 340px;
        }

        .grid-item-source .q-card,
        .grid-item-current .q-card {
            height: auto !important;
        }

        .grid-item-source .card-table-section,
        .grid-item-current .card-table-section {
            height: auto;
            overflow: visible;
        }

        .grid-item-source .page-table,
        .grid-item-current .page-table {
            height: auto !important;
        }

        .grid-item-source .q-table__middle,
        .grid-item-current .q-table__middle {
            overflow: visible;
            max-height: none;
        }
    }

    .card-title-section {
        height: 34px;
        padding: 0;

        .card-title-text {
            height: 100%;
            display: flex;
            flex-direction: row;
            align-items: center;
            padding-left: 12px;
            font-size: 13px;
        }
    }

    .card-table-section {
        height: calc(100% - 34px);
        min-height: 0;
        overflow: hidden;

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
