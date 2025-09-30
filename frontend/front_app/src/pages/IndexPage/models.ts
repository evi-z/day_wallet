import { QTableColumn } from "quasar"

export const InitAndCurrentDataColumns: QTableColumn[] = [
    { field: 'label', name: 'label', label: 'name', align: 'left' },
    { field: 'value', name: 'value', label: 'value' },
] as const

export type InitAndCurrentBaseRow<T extends string> = {
    name: T,
    label: string,
    type: 'text' | 'input',
    value: any,
}

export const CalendarColumn = {
    date: 'date',
    day_of_week: 'day_of_week',
    plan: 'plan',
    fact: 'fact',
} as const

export const CalendarDataColumns: QTableColumn[] = [
    { field: CalendarColumn.date, name: CalendarColumn.date, label: 'Дата', align: 'left' },
    { field: CalendarColumn.day_of_week, name: CalendarColumn.day_of_week, label: 'День', align: 'left' },
    { field: CalendarColumn.plan, name: CalendarColumn.plan, label: 'План', align: 'left' },
    { field: CalendarColumn.fact, name: CalendarColumn.fact, label: 'Факт', align: 'left' },
] as const
