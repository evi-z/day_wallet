import { QTableColumn } from "quasar"
import { TableCellType, TableCellTypeMap, TableCellFormatTypeMap, TableCellFormatType } from "src/components/TableCell/models"
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

export type PeriodDocInitAndCurrentBaseRow<T extends string> = {
    name: T,
    label: string,
    cellType: TableCellTypeMap,
    cellFormat: TableCellFormatTypeMap,
    // value: any,
}

/** Строки таблицы "Исходные данные" */
export const PeriodDocInitDataRows: PeriodDocInitAndCurrentBaseRow<PeriodDocInitDataFieldsMap>[] = [
    {
        name: PeriodDocInitDataFields.total_budget,
        label: 'Общий бюджет',
        cellType: TableCellType.input,
        cellFormat: TableCellFormatType.currency,
    },
    {
        name: PeriodDocInitDataFields.weekend_plan,
        label: 'План на выходные',
        cellType: TableCellType.input,
        cellFormat: TableCellFormatType.currency,
    },
    {
        name: PeriodDocInitDataFields.total_days,
        label: 'Всего дней',
        cellType: TableCellType.text,
        cellFormat: TableCellFormatType.plain,
    },
    {
        name: PeriodDocInitDataFields.weekend_days,
        label: 'Выходных дней',
        cellType: TableCellType.text,
        cellFormat: TableCellFormatType.plain,
    },
    {
        name: PeriodDocInitDataFields.weekday_days,
        label: 'Будних дней',
        cellType: TableCellType.text,
        cellFormat: TableCellFormatType.plain,
    },

    {
        name: PeriodDocInitDataFields.total_weekends_budget,
        label: 'Бюджет на выходные',
        cellType: TableCellType.text,
        cellFormat: TableCellFormatType.currency,
    },

    {
        name: PeriodDocInitDataFields.total_weekdays_budget,
        label: 'Бюджет на будни',
        cellType: TableCellType.text,
        cellFormat: TableCellFormatType.currency,
    },

    {
        name: PeriodDocInitDataFields.initial_plan,
        label: 'Начальный план',
        cellType: TableCellType.text,
        cellFormat: TableCellFormatType.currency,
    },
] as const

/** Строки таблицы "Текущие данные" */
export const PeriodDocCurrentDataRows: PeriodDocInitAndCurrentBaseRow<PeriodDocCurrentDataFieldsMap>[] = [
    {
        name: PeriodDocCurrentDataFields.current_date,
        label: 'Текущая дата',
        cellType: TableCellType.text,
        cellFormat: TableCellFormatType.plain,
    },
    {
        name: PeriodDocCurrentDataFields.days_remaining,
        label: 'Осталось дней',
        cellType: TableCellType.text,
        cellFormat: TableCellFormatType.plain,
    },
    {
        name: PeriodDocCurrentDataFields.weekends_remaining,
        label: 'Осталось выходных',
        cellType: TableCellType.text,
        cellFormat: TableCellFormatType.plain,
    },
    {
        name: PeriodDocCurrentDataFields.weekdays_remaining,
        label: 'Осталось будних',
        cellType: TableCellType.text,
        cellFormat: TableCellFormatType.plain,
    },
    {
        name: PeriodDocCurrentDataFields.total_spent_actual,
        label: 'Всего потрачено',
        cellType: TableCellType.text,
        cellFormat: TableCellFormatType.currency,
    },
    {
        name: PeriodDocCurrentDataFields.spent_on_weekends,
        label: 'Потрачено выходные',
        cellType: TableCellType.text,
        cellFormat: TableCellFormatType.currency,
    },
    {
        name: PeriodDocCurrentDataFields.spent_on_weekdays,
        label: 'Потрачено будни',
        cellType: TableCellType.text,
        cellFormat: TableCellFormatType.currency,
    },
    {
        name: PeriodDocCurrentDataFields.total_remaining,
        label: 'Общий остаток',
        cellType: TableCellType.text,
        cellFormat: TableCellFormatType.currency,
    },
    {
        name: PeriodDocCurrentDataFields.remaining_for_weekends,
        label: 'Остаток выходные',
        cellType: TableCellType.text,
        cellFormat: TableCellFormatType.currency,
    },
    {
        name: PeriodDocCurrentDataFields.remaining_for_weekdays,
        label: 'Остаток будни',
        cellType: TableCellType.text,
        cellFormat: TableCellFormatType.currency,
    },
    {
        name: PeriodDocCurrentDataFields.plan_for_today,
        label: 'План на сегодня',
        cellType: TableCellType.text,
        cellFormat: TableCellFormatType.currency,
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
