import type { BudgetCategory, BudgetIncome, BudgetPeriodData } from './types'

export const createBudgetId = (): string => {
    const cryptoObj = globalThis.crypto as Crypto | undefined
    if (cryptoObj?.randomUUID) return cryptoObj.randomUUID()
    return `budget-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Стартовый набор статей по мотивам личной книги «Финансовый учёт».
 * Это только названия разделов: суммы и подстатьи пользователь задаёт сам.
 */
export const createDefaultCategories = (): BudgetCategory[] => [
    'Долги',
    'Жизнь',
    'Дом и шмот',
    'Операционные',
    'Отпуск',
    'Буфер НП',
    'Спецсчета',
    'Уникальные',
].map(name => ({
    id: createBudgetId(),
    name,
    children: [],
}))

/** Глубокая копия дерева статей с сохранением id: они связывают периоды. */
export const cloneCategories = (categories: BudgetCategory[]): BudgetCategory[] => {
    return categories.map(category => ({
        ...category,
        children: category.children.map(child => ({ ...child })),
    }))
}

export const createIncome = (name = 'Зарплата', amount = 0): BudgetIncome => ({
    id: createBudgetId(),
    name,
    amount,
    allocations: {},
})

export const createPeriodData = (params: {
    label: string
    seq: number
    categories: BudgetCategory[]
    incomeName?: string
    incomeAmount?: number
}): BudgetPeriodData => ({
    label: params.label,
    seq: params.seq,
    incomes: [createIncome(params.incomeName || 'Зарплата', params.incomeAmount || 0)],
    categories: cloneCategories(params.categories),
    savingsDeltas: {},
    notes: '',
})

export const nextPeriodSeq = (periods: Array<{ seq?: number }>): number => {
    const max = periods.reduce((acc, period) => Math.max(acc, Number(period.seq) || 0), 0)
    return max + 1
}

/** Следующее название периода: если предыдущий — месяц, предлагаем следующий месяц. */
export const suggestNextLabel = (periods: Array<{ label?: string }>): string => {
    const months = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
    ]
    const last = periods[periods.length - 1]?.label?.trim()
    if (!last) return ''

    const match = /^([А-Яа-яЁё]+)\s+(\d{4})$/.exec(last)
    if (!match) return ''

    const monthIndex = months.findIndex(month => month.toLowerCase() === match[1]!.toLowerCase())
    if (monthIndex === -1) return ''

    const year = Number(match[2])
    if (monthIndex === 11) return `${months[0]} ${year + 1}`
    return `${months[monthIndex + 1]} ${year}`
}
