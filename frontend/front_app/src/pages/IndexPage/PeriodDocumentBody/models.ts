import { QTableColumn } from "quasar"
import { PeriodDocCurrentDataFields, PeriodDocCurrentDataFieldsMap, PeriodDocInitDataFields, PeriodDocInitDataFieldsMap } from "src/models/period_doc"
import { AppDate } from "src/utils/date"


/** Столбцы таблицы "Исходные данные" и "Текущие данные" */
export const PeriodDocInitAndCurrentDataColumns: QTableColumn[] = [
    { field: 'label', name: 'label', label: 'name', align: 'left' },
    { field: 'value', name: 'value', label: 'value', style: 'width: 20%; min-width: 120px; max-width: 400px;' },
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
    { field: PeriodDocCalendarColumn.fact, name: PeriodDocCalendarColumn.fact, label: 'Факт', align: 'left' },
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

export type PeriodDocInitRowValues = Record<PeriodDocInitDataFieldsMap, number>
export type PeriodDocCurrentRowValues = Record<PeriodDocCurrentDataFieldsMap, number | string>
export type PeriodDocCalendarRow = {
    _date: AppDate,
    date_friendly: string,
    day_of_week: string,
    plan: number,
    fact: number,
}

export type PeriodDocCalendarRowValues = Record<string, number>
