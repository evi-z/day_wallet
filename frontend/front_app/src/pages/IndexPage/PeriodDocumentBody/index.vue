<template>
    <div class="page-container">
        <!-- Сегодня -->
        <section class="grid-item-today">
            <q-card flat bordered class="today-card">
                <q-card-section class="today-main">
                    <div class="today-head">
                        <div>
                            <div class="today-title">{{ cockpit.title }}</div>
                            <div class="today-date">{{ cockpit.subtitle }}</div>
                        </div>
                        <span class="today-status" :class="{ 'today-status--negative': cockpit.statusNegative }">
                            {{ cockpit.statusLabel }}
                        </span>
                    </div>

                    <div class="today-stats">
                        <div v-for="stat in cockpit.stats" :key="stat.label" class="today-stat">
                            <span class="today-stat__label">{{ stat.label }}</span>
                            <span class="today-stat__value" :class="{ 'text-negative': stat.negative }">
                                {{ stat.value }}
                            </span>
                        </div>
                    </div>

                    <q-linear-progress :value="cockpit.progress" size="5px" rounded
                        :color="cockpit.progressNegative ? 'negative' : 'primary'" track-color="grey-3" />
                    <div class="today-progress-caption">
                        <span>{{ cockpit.progressCaption }}</span>
                        <span>{{ cockpit.progressRight }}</span>
                    </div>
                </q-card-section>

            </q-card>
        </section>

        <!-- Итоги периода -->
        <section class="grid-item-totals">
            <InfoCard v-model="totalsOpen" title="Итоги периода">
                <template #summary>
                    <q-chip dense class="summary-chip">
                        <span class="summary-chip__label">потрачено</span>
                        <span class="summary-chip__value">{{ formatMoney(totals.spent) }}</span>
                    </q-chip>
                    <q-chip dense class="summary-chip"
                        :class="totals.remaining < 0 ? 'summary-chip--negative' : 'summary-chip--positive'">
                        <span class="summary-chip__label">осталось</span>
                        <span class="summary-chip__value">{{ formatMoney(totals.remaining) }}</span>
                    </q-chip>
                </template>
                <div class="stat-grid">
                    <div class="stat-tile"><span>Потрачено</span><strong>{{ formatMoney(totals.spent) }}</strong></div>
                    <div class="stat-tile"><span>Осталось</span><strong>{{ formatMoney(totals.remaining) }}</strong></div>
                    <div class="stat-tile"><span>Дней</span><strong>{{ totals.days }}</strong></div>
                    <div class="stat-tile"><span>Выходных / будних</span><strong>{{ totals.weekends }} / {{ totals.weekdays }}</strong></div>
                    <div class="stat-tile"><span>Потрачено выходные</span><strong>{{ formatMoney(totals.spentWeekends) }}</strong></div>
                    <div class="stat-tile"><span>Потрачено будни</span><strong>{{ formatMoney(totals.spentWeekdays) }}</strong></div>
                </div>
            </InfoCard>
        </section>

        <!-- Календарь -->
        <section class="grid-item-result">
            <q-card class="full-height">
                <q-card-section class="card-title-section">
                    <div class="text-subtitle1 card-title-text">
                        <span>Календарь</span>
                        <span class="calendar-dates">{{ document.from_date }} – {{ document.to_date }}</span>
                        <q-space />
                        <q-btn icon="calendar_month" flat round dense size="sm" @click="handleEdit" />
                    </div>
                </q-card-section>
                <q-card-section class="no-padding card-table-section">
                    <q-table square flat class="full-height page-table" :columns="PeriodDocCalendarDataColumns"
                        :row-key="PeriodDocCalendarColumn.date_friendly" :rows="calendarRows" dense :rows-per-page="[0]"
                        v-model:pagination="initCurrentPagination" hide-bottom separator="none">
                        <template #body="props">
                            <q-tr :props="props" :class="{
                                'is-weekend': props.row.date.isWeekend(),
                                'is-today': props.row.date.isToday(),
                            }">
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
        </section>

        <!-- Параметры периода -->
        <section class="grid-item-params">
            <InfoCard v-model="paramsOpen" title="Параметры периода" summary-placement="inline">
                <template #summary>
                    <q-chip dense class="summary-chip">
                        <span class="summary-chip__label">бюджет</span>
                        <span class="summary-chip__value">{{ formatMoney(params.budget) }}</span>
                    </q-chip>
                    <q-chip dense class="summary-chip">
                        <span class="summary-chip__label">выходные</span>
                        <span class="summary-chip__value">{{ formatMoney(params.weekend) }}</span>
                    </q-chip>
                </template>
                <div class="params-form">
                    <MoneyInput v-model="periodBudget" label="Бюджет периода" />
                    <MoneyInput v-model="weekendPlan" label="План на выходные" />
                    <div class="params-summary">
                        <div>Будни: {{ formatMoney(params.initialPlan) }} / день</div>
                        <div>Выходные: {{ formatMoney(params.weekend) }} / день</div>
                        <div class="text-caption text-grey-7">
                            {{ params.totalDays }} {{ plural(params.totalDays, 'день', 'дня', 'дней') }} ·
                            {{ params.weekendDays }} {{ plural(params.weekendDays, 'выходной', 'выходных', 'выходных') }} ·
                            {{ params.weekdayDays }} {{ plural(params.weekdayDays, 'будний', 'будних', 'будних') }}
                        </div>
                    </div>
                </div>
            </InfoCard>
        </section>
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
    PeriodDocCalendarColumn,
    PeriodDocInitCalcRowValues,
    PeriodDocCurrentRowValues,
    PeriodDocCalendarRow,
} from './models';
import { onBeforeUnmount, onMounted, ref, shallowRef, computed, triggerRef, reactive, watch } from 'vue';
import { PeriodDocumentDBData } from 'src/models/database';
import { AppDate } from 'src/utils/date';
import { getPeriodDocumentCalendarDataRows } from './funs';
import TableCell from 'src/components/TableCell/index.vue';
import MoneyInput from 'src/components/MoneyInput/index.vue';
import InfoCard from 'src/components/InfoCard/index.vue';
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
const totalsOpen = ref($q.screen.gt.sm)
const paramsOpen = ref($q.screen.gt.sm)

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

/** Редактируемые значения периода для формы параметров */
const periodBudget = computed({
    get: () => Number(documentMainDBValues.value.total_budget) || 0,
    set: (value: number) => { documentMainDBValues.value.total_budget = value },
})

const weekendPlan = computed({
    get: () => Number(documentMainDBValues.value.weekend_plan) || 0,
    set: (value: number) => { documentMainDBValues.value.weekend_plan = value },
})

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
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value)
}

const plural = (n: number, one: string, few: string, many: string) => {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return one
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
    return many
}

const todayStats = computed(() => ({
    plan: Number(currentDataCalcValues.value.plan_for_today) || 0,
    spent: Number(currentDataCalcValues.value.spent_today) || 0,
    remaining: Number(currentDataCalcValues.value.remaining_today) || 0,
}))

const totals = computed(() => ({
    spent: Number(currentDataCalcValues.value.total_spent_actual) || 0,
    remaining: Number(currentDataCalcValues.value.total_remaining) || 0,
    days: Number(currentDataCalcValues.value.days_remaining) || 0,
    weekends: Number(currentDataCalcValues.value.weekends_remaining) || 0,
    weekdays: Number(currentDataCalcValues.value.weekdays_remaining) || 0,
    spentWeekends: Number(currentDataCalcValues.value.spent_on_weekends) || 0,
    spentWeekdays: Number(currentDataCalcValues.value.spent_on_weekdays) || 0,
}))

const params = computed(() => ({
    budget: periodBudget.value,
    weekend: weekendPlan.value,
    initialPlan: Number(initDataCalcValues.value.initial_plan) || 0,
    totalDays: Number(initDataCalcValues.value.total_days) || 0,
    weekendDays: Number(initDataCalcValues.value.weekend_days) || 0,
    weekdayDays: Number(initDataCalcValues.value.weekday_days) || 0,
}))

const progressRaw = computed(() => {
    if (params.value.budget <= 0) return 0
    return (totals.value.spent / params.value.budget) * 100
})

const periodStatus = computed<'before' | 'current' | 'after'>(() => {
    const today = currentDate.value.iso
    const from = AppDate.fromFriendlyFormat(document.from_date).iso
    const to = AppDate.fromFriendlyFormat(document.to_date).iso
    if (today < from) return 'before'
    if (today > to) return 'after'
    return 'current'
})

const cockpit = computed(() => {
    const progress = Math.min(100, Math.max(0, progressRaw.value)) / 100
    const progressNegative = progressRaw.value > 100

    if (periodStatus.value === 'current') {
        return {
            title: 'Сегодня',
            subtitle: currentDate.value.friendly,
            statusLabel: todayStats.value.remaining < 0 ? 'перерасход' : 'в рамках плана',
            statusNegative: todayStats.value.remaining < 0,
            stats: [
                { label: 'План', value: formatMoney(todayStats.value.plan), negative: false },
                { label: 'Потрачено', value: formatMoney(todayStats.value.spent), negative: false },
                {
                    label: 'Осталось',
                    value: formatMoney(todayStats.value.remaining),
                    negative: todayStats.value.remaining < 0,
                },
            ],
            progress,
            progressNegative,
            progressCaption: `Потрачено ${Math.round(progressRaw.value)}% бюджета`,
            progressRight: `Осталось ${totals.value.days} дн.`,
        }
    }

    if (periodStatus.value === 'after') {
        return {
            title: 'Период завершён',
            subtitle: `${document.from_date} – ${document.to_date}`,
            statusLabel: totals.value.remaining < 0 ? 'перерасход' : 'в бюджете',
            statusNegative: totals.value.remaining < 0,
            stats: [
                { label: 'Потрачено', value: formatMoney(totals.value.spent), negative: false },
                {
                    label: 'Осталось',
                    value: formatMoney(totals.value.remaining),
                    negative: totals.value.remaining < 0,
                },
                { label: 'Бюджет', value: formatMoney(params.value.budget), negative: false },
            ],
            progress,
            progressNegative,
            progressCaption: `Потрачено ${Math.round(progressRaw.value)}% бюджета`,
            progressRight: 'Период закрыт',
        }
    }

    return {
        title: 'Период ещё не начался',
        subtitle: `${document.from_date} – ${document.to_date}`,
        statusLabel: 'запланирован',
        statusNegative: false,
        stats: [
            { label: 'Бюджет', value: formatMoney(params.value.budget), negative: false },
            {
                label: 'Дней',
                value: `${params.value.totalDays} ${plural(params.value.totalDays, 'день', 'дня', 'дней')}`,
                negative: false,
            },
            { label: 'План будней', value: `${formatMoney(params.value.initialPlan)} / день`, negative: false },
        ],
        progress: 0,
        progressNegative: false,
        progressCaption: 'Период ещё не начался',
        progressRight: 'До начала',
    }
})

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
    grid-template-columns: minmax(0, 1fr) 340px;
    grid-template-rows: auto auto minmax(0, 1fr);
    grid-template-areas:
        "result today"
        "result totals"
        "result params";
}

@media (min-width: 1440px) {
    .page-container {
        grid-template-columns: minmax(0, 1fr) 360px;
    }
}

@media (max-width: 1023px) {
    .page-container {
        height: auto;
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: auto auto auto auto;
        grid-template-areas:
            "today"
            "totals"
            "params"
            "result";
    }

    .grid-item-result {
        height: 56vh;
        min-height: 340px;
    }
}

.grid-item-result {
    grid-area: result;
    min-width: 0;
    min-height: 0;
}

.grid-item-today {
    grid-area: today;
    min-width: 0;
}

.grid-item-totals {
    grid-area: totals;
    min-width: 0;
}

.grid-item-params {
    grid-area: params;
    align-self: start;
    min-width: 0;
}

.card-title-section {
    height: 34px;
    padding: 0;
}

.card-title-text {
    display: flex;
    align-items: center;
    height: 100%;
    min-width: 0;
    padding-left: 12px;
    font-size: 13px;
}

.calendar-dates {
    margin-left: 8px;
    font-size: 11px;
    font-weight: 400;
    color: #6b7280;
    white-space: nowrap;
}

.card-table-section {
    height: calc(100% - 34px);
    min-height: 0;
    overflow: hidden;
}

.page-table {
    border-top: 1px solid #eef2f0;

    :deep(thead tr) {
        height: 28px;
    }

    :deep(thead th) {
        background: transparent;
        border-bottom: 1px solid #eef2f0;
        color: #6b7280;
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 0.03em;
        text-transform: uppercase;
    }

    :deep(tbody td) {
        padding: 4px 8px;
        border-right: none;
        border-left: none;
        border-bottom: 1px solid #eef2f0;
    }

    :deep(tbody tr:last-child td) {
        border-bottom: none;
    }

    :deep(tbody tr.is-weekend) {
        background: rgba(185, 28, 28, 0.035);
    }

    :deep(tbody tr.is-today) {
        background: rgba(6, 95, 70, 0.07);
        box-shadow: inset 3px 0 0 #065f46;
    }

    :deep(tbody tr:hover) {
        background: rgba(6, 95, 70, 0.05);
    }

    :deep(td.cell-input .q-field__control) {
        background: transparent;
    }

    :deep(td.cell-input .q-field__control:hover) {
        background: rgba(6, 95, 70, 0.05);
    }
}

.today-card {
    border-radius: 10px;
}

.today-main {
    padding: 12px;
}

.today-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
}

.today-title {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
}

.today-date {
    font-size: 11px;
    color: #6b7280;
}

.today-status {
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(6, 95, 70, 0.09);
    color: #065f46;
    font-size: 10px;
    white-space: nowrap;
}

.today-status--negative {
    background: rgba(185, 28, 28, 0.08);
    color: #b91c1c;
}

.today-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 10px 0 8px;
}

.today-stat__label {
    display: block;
    margin-bottom: 2px;
    font-size: 10px;
    color: #6b7280;
}

.today-stat__value {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #111827;
    white-space: nowrap;
}

.today-progress-caption {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 4px;
    font-size: 10px;
    color: #6b7280;
}

.summary-chip {
    height: 22px;
    margin: 0;
    padding: 0 3px;
    border-radius: 7px;
    background: #f3f6f4;
    color: #374151;
    font-size: 10px;
}

.summary-chip :deep(.q-chip__content) {
    display: flex;
    align-items: center;
    gap: 2px;
}

.summary-chip__label {
    color: #6b7280;
    font-size: 9px;
}

.summary-chip__value {
    color: #111827;
    font-size: 10px;
    font-weight: 600;
}

.summary-chip--positive {
    background: #e9f4ef;
}

.summary-chip--positive .summary-chip__value {
    color: #065f46;
}

.summary-chip--negative {
    background: #fdecec;
}

.summary-chip--negative .summary-chip__value {
    color: #b91c1c;
}

.stat-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
    padding: 10px 12px 12px;
}

.stat-tile {
    min-width: 0;
    padding: 6px 8px;
    background: #f8faf9;
    border: 1px solid #eef2f0;
    border-radius: 8px;
}

.stat-tile span {
    display: block;
    font-size: 9px;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #6b7280;
}

.stat-tile strong {
    display: block;
    margin-top: 2px;
    overflow: hidden;
    color: #111827;
    font-size: 12px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.params-form {
    display: grid;
    gap: 8px;
    padding: 12px;
}

.params-summary {
    display: grid;
    gap: 2px;
    font-size: 12px;
    color: #374151;
}
</style>
