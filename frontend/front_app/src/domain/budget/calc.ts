import type {
    BudgetCategory,
    BudgetIncome,
    BudgetLeaf,
    BudgetPeriodData,
    BudgetSavingsAccount,
} from './types'

export const roundMoney = (value: number): number => Math.round(value * 100) / 100

const toNumber = (value: unknown): number => {
    const num = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(num) ? num : 0
}

/** Все листья дерева статей: подстатья, а при их отсутствии — сама статья. */
export const listLeaves = (categories: BudgetCategory[]): BudgetLeaf[] => {
    const leaves: BudgetLeaf[] = []
    for (const category of categories) {
        if (category.children.length) {
            for (const child of category.children) {
                leaves.push({
                    id: child.id,
                    name: child.name,
                    categoryId: category.id,
                    categoryName: category.name,
                    subcategoryId: child.id,
                    savingsAccountId: child.savingsAccountId,
                })
            }
        } else {
            leaves.push({
                id: category.id,
                name: category.name,
                categoryId: category.id,
                categoryName: category.name,
                savingsAccountId: category.savingsAccountId,
            })
        }
    }
    return leaves
}

export type BudgetIncomeTotals = {
    amount: number
    allocated: number
    free: number
    /** Суммы по статьям, которых уже нет в дереве */
    orphaned: number
}

/** Итоги одного прихода. Нераспознанные статьи не прячутся: они попадают в orphaned. */
export const calcIncomeTotals = (
    period: BudgetPeriodData,
    income: BudgetIncome,
): BudgetIncomeTotals => {
    const leafIds = new Set(listLeaves(period.categories).map(leaf => leaf.id))
    let allocated = 0
    let orphaned = 0

    for (const [leafId, value] of Object.entries(income.allocations || {})) {
        const amount = toNumber(value)
        if (!amount) continue
        allocated += amount
        if (!leafIds.has(leafId)) orphaned += amount
    }

    const amount = toNumber(income.amount)
    return {
        amount: roundMoney(amount),
        allocated: roundMoney(allocated),
        free: roundMoney(amount - allocated),
        orphaned: roundMoney(orphaned),
    }
}

export type BudgetPeriodTotals = {
    incomeTotal: number
    allocatedTotal: number
    freeTotal: number
    orphanedTotal: number
    /** Распределения по каждому листу за весь период */
    byLeaf: Record<string, number>
    /** Итоги по статьям верхнего уровня, включая подстатьи */
    byCategory: Record<string, number>
}

export const calcPeriodTotals = (period: BudgetPeriodData): BudgetPeriodTotals => {
    const totals: BudgetPeriodTotals = {
        incomeTotal: 0,
        allocatedTotal: 0,
        freeTotal: 0,
        orphanedTotal: 0,
        byLeaf: {},
        byCategory: {},
    }

    for (const income of period.incomes) {
        totals.incomeTotal += toNumber(income.amount)
        for (const [leafId, value] of Object.entries(income.allocations || {})) {
            const amount = toNumber(value)
            if (!amount) continue
            totals.allocatedTotal += amount
            totals.byLeaf[leafId] = roundMoney((totals.byLeaf[leafId] ?? 0) + amount)
        }
    }

    for (const leaf of listLeaves(period.categories)) {
        const leafTotal = totals.byLeaf[leaf.id] ?? 0
        if (!leafTotal) continue
        totals.byCategory[leaf.categoryId] = roundMoney(
            (totals.byCategory[leaf.categoryId] ?? 0) + leafTotal,
        )
    }

    const leafIds = new Set(listLeaves(period.categories).map(leaf => leaf.id))
    for (const [leafId, amount] of Object.entries(totals.byLeaf)) {
        if (!leafIds.has(leafId)) totals.orphanedTotal += amount
    }

    totals.incomeTotal = roundMoney(totals.incomeTotal)
    totals.allocatedTotal = roundMoney(totals.allocatedTotal)
    totals.freeTotal = roundMoney(totals.incomeTotal - totals.allocatedTotal)
    totals.orphanedTotal = roundMoney(totals.orphanedTotal)
    return totals
}

/** Сколько этот период распределил на конкретный сберегательный счёт. */
export const calcSavingsAllocatedInPeriod = (
    period: BudgetPeriodData,
    accountId: string,
): number => {
    const totals = calcPeriodTotals(period)
    let allocated = 0
    for (const leaf of listLeaves(period.categories)) {
        if (leaf.savingsAccountId !== accountId) continue
        allocated += totals.byLeaf[leaf.id] ?? 0
    }
    return roundMoney(allocated)
}

export const calcSavingsDeltaInPeriod = (
    period: BudgetPeriodData,
    accountId: string,
): number => roundMoney(toNumber(period.savingsDeltas?.[accountId]))

export type BudgetSavingsHistoryEntry = {
    periodId: string
    label: string
    seq: number
    allocated: number
    delta: number
    balance: number
}

export type BudgetSavingsBalance = {
    accountId: string
    balance: number
    allocatedInPeriod?: number
    deltaInPeriod?: number
    history: BudgetSavingsHistoryEntry[]
}

/**
 * Остаток сберегательного счёта: начальный остаток плюс распределения
 * из приходов и ручные фактические пополнения. Периоды применяются по seq.
 */
export const calcSavingsBalance = (
    periods: Array<BudgetPeriodData & { _id?: string }>,
    account: BudgetSavingsAccount,
    currentPeriod?: BudgetPeriodData & { _id?: string },
): BudgetSavingsBalance => {
    const ordered = [...periods].sort((a, b) => a.seq - b.seq)
    const history: BudgetSavingsHistoryEntry[] = []
    let balance = roundMoney(toNumber(account.initialBalance))

    for (const period of ordered) {
        const allocated = calcSavingsAllocatedInPeriod(period, account.id)
        const delta = calcSavingsDeltaInPeriod(period, account.id)
        if (!allocated && !delta) continue
        balance = roundMoney(balance + allocated + delta)
        history.push({
            periodId: period._id ?? '',
            label: period.label,
            seq: period.seq,
            allocated,
            delta,
            balance,
        })
    }

    const result: BudgetSavingsBalance = { accountId: account.id, balance, history }
    if (currentPeriod) {
        result.allocatedInPeriod = calcSavingsAllocatedInPeriod(currentPeriod, account.id)
        result.deltaInPeriod = calcSavingsDeltaInPeriod(currentPeriod, account.id)
    }
    return result
}

/** Итоги сбережений по всем периодам для всех счетов. */
export const calcAllSavingsBalances = (
    periods: Array<BudgetPeriodData & { _id?: string }>,
    accounts: BudgetSavingsAccount[],
    currentPeriod?: BudgetPeriodData & { _id?: string },
): Record<string, BudgetSavingsBalance> => {
    const result: Record<string, BudgetSavingsBalance> = {}
    for (const account of accounts) {
        result[account.id] = calcSavingsBalance(periods, account, currentPeriod)
    }
    return result
}

/** Проверяет, есть ли по листу распределения хотя бы в одном приходе. */
export const hasLeafAllocations = (period: BudgetPeriodData, leafId: string): boolean => {
    return period.incomes.some(income => Math.abs(toNumber(income.allocations?.[leafId])) > 0.004)
}

/** Используется ли сберегательный счёт хотя бы в одном периоде */
export const isSavingsAccountUsed = (
    periods: BudgetPeriodData[],
    accountId: string,
): boolean => {
    return periods.some(period => {
        if (Math.abs(calcSavingsAllocatedInPeriod(period, accountId)) > 0.004) return true
        return Math.abs(calcSavingsDeltaInPeriod(period, accountId)) > 0.004
    })
}
