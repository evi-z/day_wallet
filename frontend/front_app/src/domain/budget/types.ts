/**
 * Модель бюджетирования Day Wallet.
 *
 * Финансовый период объединяет приходы. Распределение принадлежит приходу:
 * для каждого прихода пользователь решает, сколько направить по статьям.
 * Статьи и подстатьи — пользовательские направления, а не банковские операции.
 */

export type BudgetSubcategory = {
    id: string
    name: string
    /** Если задан, распределения по подстатье пополняют этот сберегательный счёт */
    savingsAccountId?: string | undefined
}

export type BudgetCategory = {
    id: string
    name: string
    /** Если задан, распределения по статье пополняют этот сберегательный счёт */
    savingsAccountId?: string | undefined
    children: BudgetSubcategory[]
}

export type BudgetIncome = {
    id: string
    name: string
    amount: number
    /** Суммы по листовым статьям: id статьи или подстатьи → рубли */
    allocations: Record<string, number>
}

export type BudgetPeriodData = {
    label: string
    /** Порядок периодов; точные даты для бюджета не обязательны */
    seq: number
    incomes: BudgetIncome[]
    categories: BudgetCategory[]
    /** Фактические дополнительные пополнения сбережений: accountId → рубли */
    savingsDeltas: Record<string, number>
    notes: string
}

export type BudgetSavingsAccount = {
    id: string
    name: string
    /** Остаток на момент начала учёта в приложении */
    initialBalance: number
    createdAt: string
}

export type BudgetSettingsData = {
    savingsAccounts: BudgetSavingsAccount[]
}

export type BudgetTemplateData = {
    categories: BudgetCategory[]
}

/** Лист дерева статей — то, по чему вводится сумма */
export type BudgetLeaf = {
    id: string
    name: string
    categoryId: string
    categoryName: string
    subcategoryId?: string | undefined
    savingsAccountId?: string | undefined
}
