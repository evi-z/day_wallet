export const PeriodDocInitDataFields = {
    total_budget: 'total_budget',  // Общий бюджет на период
    weekend_plan: 'weekend_plan',  // План на выходные
    total_days: 'total_days',  // Общее количество дней
    weekend_days: 'weekend_days',  // Количество выходных дней
    weekday_days: 'weekday_days',  // Количество рабочих дней
    total_weekends_budget: 'total_weekends_budget',  // Бюджет на выходные
    total_weekdays_budget: 'total_weekdays_budget',  // Бюджет на будние
    initial_plan: 'initial_plan'  // Начальный план
} as const

export type PeriodDocInitDataFieldsMap = typeof PeriodDocInitDataFields[keyof typeof PeriodDocInitDataFields]

export const PeriodDocCurrentDataFields = {
    current_date: 'current_date',  // Текущая дата
    days_remaining: 'days_remaining',  // Количество оставшихся дней
    weekends_remaining: 'weekends_remaining',  // Количество оставшихся выходных дней
    weekdays_remaining: 'weekdays_remaining',  // Количество оставшихся рабочих дней
    total_spent_actual: 'total_spent_actual',  // Общее количество потраченных денег
    spent_on_weekends: 'spent_on_weekends',  // Количество потраченных денег в выходные
    spent_on_weekdays: 'spent_on_weekdays',  // Количество потраченных денег в будние
    total_remaining: 'total_remaining',  // Общее количество оставшихся денег
    remaining_for_weekends: 'remaining_for_weekends',  // Количество оставшихся денег в выходные
    remaining_for_weekdays: 'remaining_for_weekdays',  // Количество оставшихся денег в будние
    plan_for_today: 'plan_for_today'  // План на сегодня
} as const

export type PeriodDocCurrentDataFieldsMap = typeof PeriodDocCurrentDataFields[keyof typeof PeriodDocCurrentDataFields]
