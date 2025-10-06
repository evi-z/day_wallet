import { QTableColumn } from "quasar"
import { PeriodDocumentMainValuesData } from "src/models/database"
import { PeriodDocCurrentDataFields, PeriodDocCurrentDataFieldsMap, PeriodDocInitDataFields, PeriodDocInitDataFieldsMap } from "src/models/period_doc"
import { AppDate } from "src/utils/date"

const inputColumnStyle = 'width: 20%; min-width: 120px; max-width: 400px;'

/** Столбцы таблицы "Исходные данные" и "Текущие данные" */
export const PeriodDocInitAndCurrentDataColumns: QTableColumn[] = [
    { field: 'label', name: 'label', label: 'name', align: 'left' },
    { field: 'value', name: 'value', label: 'value', style: inputColumnStyle },
] as const


/** Столбцы таблицы "Календарь" */
export const PeriodDocCalendarColumn = {
    date_friendly: 'date_friendly',
    day_of_week: 'day_of_week',
    plan: 'plan',
    fact: 'fact',
} as const

/** Столбцы таблицы "Календарь" */
export const PeriodDocCalendarDataColumns: QTableColumn[] = [
    { field: PeriodDocCalendarColumn.date_friendly, name: PeriodDocCalendarColumn.date_friendly, label: 'Дата', align: 'left' },
    { field: PeriodDocCalendarColumn.day_of_week, name: PeriodDocCalendarColumn.day_of_week, label: 'День', align: 'left' },
    { field: PeriodDocCalendarColumn.plan, name: PeriodDocCalendarColumn.plan, label: 'План', align: 'left' },
    { field: PeriodDocCalendarColumn.fact, name: PeriodDocCalendarColumn.fact, label: 'Факт', align: 'left', style: inputColumnStyle },
] as const

export const PeriodDocInitAndCurrentCellType = {
    text: 'text',
    input: 'input',
} as const

export type PeriodDocInitAndCurrentCellType = typeof PeriodDocInitAndCurrentCellType[keyof typeof PeriodDocInitAndCurrentCellType]

export type PeriodDocInitAndCurrentBaseRow<T extends string> = {
    name: T,
    label: string,
    type: PeriodDocInitAndCurrentCellType,
    // value: any,
}

/** Строки таблицы "Исходные данные" */
export const PeriodDocInitDataRows: PeriodDocInitAndCurrentBaseRow<PeriodDocInitDataFieldsMap>[] = [
    {
        name: PeriodDocInitDataFields.total_budget,
        label: 'Общий бюджет',
        type: PeriodDocInitAndCurrentCellType.input,
    },
    {
        name: PeriodDocInitDataFields.weekend_plan,
        label: 'План на выходные',
        type: PeriodDocInitAndCurrentCellType.input,
    },
    {
        name: PeriodDocInitDataFields.total_days,
        label: 'Всего дней',
        type: PeriodDocInitAndCurrentCellType.text,
    },
    {
        name: PeriodDocInitDataFields.weekend_days,
        label: 'Выходных дней',
        type: PeriodDocInitAndCurrentCellType.text,
    },
    {
        name: PeriodDocInitDataFields.weekday_days,
        label: 'Будних дней',
        type: PeriodDocInitAndCurrentCellType.text,
    },

    {
        name: PeriodDocInitDataFields.total_weekends_budget,
        label: 'Бюджет на выходные',
        type: PeriodDocInitAndCurrentCellType.text,
    },

    {
        name: PeriodDocInitDataFields.total_weekdays_budget,
        label: 'Бюджет на будни',
        type: PeriodDocInitAndCurrentCellType.text,
    },

    {
        name: PeriodDocInitDataFields.initial_plan,
        label: 'Начальный план',
        type: PeriodDocInitAndCurrentCellType.text,
    },
] as const

/** Строки таблицы "Текущие данные" */
export const PeriodDocCurrentDataRows: PeriodDocInitAndCurrentBaseRow<PeriodDocCurrentDataFieldsMap>[] = [
    {
        name: PeriodDocCurrentDataFields.current_date,
        label: 'Текущая дата',
        type: PeriodDocInitAndCurrentCellType.text,
    },
    {
        name: PeriodDocCurrentDataFields.days_remaining,
        label: 'Осталось дней',
        type: PeriodDocInitAndCurrentCellType.text,
    },
    {
        name: PeriodDocCurrentDataFields.weekends_remaining,
        label: 'Осталось выходных',
        type: PeriodDocInitAndCurrentCellType.text,
    },
    {
        name: PeriodDocCurrentDataFields.weekdays_remaining,
        label: 'Осталось будних',
        type: PeriodDocInitAndCurrentCellType.text,
    },
    {
        name: PeriodDocCurrentDataFields.total_spent_actual,
        label: 'Всего потрачено',
        type: PeriodDocInitAndCurrentCellType.text,
    },
    {
        name: PeriodDocCurrentDataFields.spent_on_weekends,
        label: 'Потрачено выходные',
        type: PeriodDocInitAndCurrentCellType.text,
    },
    {
        name: PeriodDocCurrentDataFields.spent_on_weekdays,
        label: 'Потрачено будни',
        type: PeriodDocInitAndCurrentCellType.text,
    },
    {
        name: PeriodDocCurrentDataFields.total_remaining,
        label: 'Общий остаток',
        type: PeriodDocInitAndCurrentCellType.text,
    },
    {
        name: PeriodDocCurrentDataFields.remaining_for_weekends,
        label: 'Остаток выходные',
        type: PeriodDocInitAndCurrentCellType.text,
    },
    {
        name: PeriodDocCurrentDataFields.remaining_for_weekdays,
        label: 'Остаток будни',
        type: PeriodDocInitAndCurrentCellType.text,
    },
    {
        name: PeriodDocCurrentDataFields.plan_for_today,
        label: 'План на сегодня',
        type: PeriodDocInitAndCurrentCellType.text,
    },
] as const

export type PeriodDocInitCalcRowValues = Record<Exclude<PeriodDocInitDataFieldsMap, 'total_budget' | 'weekend_plan'>, number>
export type PeriodDocCurrentRowValues = Record<PeriodDocCurrentDataFieldsMap, number | string>
export type PeriodDocCalendarRow = {
    date: AppDate,
    plan: number,
}

/** Дефолтные значения для основных значений документа периода */
export const DefaultPeriodDocumentMainValues: PeriodDocumentMainValuesData = {
    total_budget: 0,
    weekend_plan: 0,
} as const
