import { calcPeriodTotals, calcSavingsAllocatedInPeriod, calcSavingsBalance, calcSavingsDeltaInPeriod, listLeaves } from './calc.ts'
import type { BudgetPeriodData, BudgetSavingsAccount } from './types'

export type BudgetSummaryNode = {
    id: string
    name: string
    isSavings: boolean
    children: BudgetSummaryNode[]
    byPeriod: Record<string, number>
    total: number
}

export type BudgetSummarySavingsRow = {
    accountId: string
    name: string
    byPeriod: Record<string, number>
    total: number
    balance: number
}

export type BudgetSummary = {
    periodIds: string[]
    periodLabels: string[]
    categories: BudgetSummaryNode[]
    incomeByPeriod: Record<string, number>
    allocatedByPeriod: Record<string, number>
    freeByPeriod: Record<string, number>
    savings: BudgetSummarySavingsRow[]
}

const add = (map: Record<string, number>, key: string, value: number) => {
    if (!value) return
    map[key] = (map[key] ?? 0) + value
}

const emptyNode = (id: string, name: string, isSavings: boolean, withChildren: boolean): BudgetSummaryNode => ({
    id,
    name,
    isSavings,
    children: withChildren ? [] : [],
    byPeriod: {},
    total: 0,
})

/**
 * Сводка по нескольким периодам: статьи и подстатьи в колонках периодов.
 * Названия и состав берутся из самого позднего периода, где элемент встречался.
 */
export const calcBudgetSummary = (
    periods: Array<BudgetPeriodData & { _id: string }>,
    accounts: BudgetSavingsAccount[],
): BudgetSummary => {
    const ordered = [...periods].sort((a, b) => a.seq - b.seq)
    const summary: BudgetSummary = {
        periodIds: ordered.map(period => period._id),
        periodLabels: ordered.map(period => period.label),
        categories: [],
        incomeByPeriod: {},
        allocatedByPeriod: {},
        freeByPeriod: {},
        savings: [],
    }

    const categoryMap = new Map<string, BudgetSummaryNode>()
    const childMaps = new Map<string, Map<string, BudgetSummaryNode>>()
    const categoryOrder: string[] = []
    const savingsByPeriod = new Map<string, Record<string, number>>()

    for (const period of ordered) {
        const totals = calcPeriodTotals(period)
        summary.incomeByPeriod[period._id] = totals.incomeTotal
        summary.allocatedByPeriod[period._id] = totals.allocatedTotal
        summary.freeByPeriod[period._id] = totals.freeTotal

        for (const category of period.categories) {
            let node = categoryMap.get(category.id)
            if (!node) {
                node = emptyNode(category.id, category.name, false, true)
                categoryMap.set(category.id, node)
                categoryOrder.push(category.id)
                childMaps.set(category.id, new Map())
            }
            node.name = category.name

            if (category.children.length) {
                for (const child of category.children) {
                    const childMap = childMaps.get(category.id)!
                    let childNode = childMap.get(child.id)
                    if (!childNode) {
                        childNode = emptyNode(child.id, child.name, !!child.savingsAccountId, false)
                        childMap.set(child.id, childNode)
                    }
                    childNode.name = child.name
                    childNode.isSavings = !!child.savingsAccountId
                    add(childNode.byPeriod, period._id, totals.byLeaf[child.id] ?? 0)
                }
            } else {
                node.isSavings = !!category.savingsAccountId
                add(node.byPeriod, period._id, totals.byLeaf[category.id] ?? 0)
            }
        }

        for (const leaf of listLeaves(period.categories)) {
            if (!leaf.savingsAccountId) continue
            const allocated = totals.byLeaf[leaf.id] ?? 0
            if (!allocated) continue
            const map = savingsByPeriod.get(leaf.savingsAccountId) ?? {}
            add(map, period._id, allocated)
            savingsByPeriod.set(leaf.savingsAccountId, map)
        }
    }

    summary.categories = categoryOrder.map((categoryId) => {
        const node = categoryMap.get(categoryId)!
        const children = Array.from(childMaps.get(categoryId)?.values() ?? [])
        node.children = children
        node.byPeriod = { ...node.byPeriod }
        for (const child of children) {
            for (const [periodId, value] of Object.entries(child.byPeriod)) {
                add(node.byPeriod, periodId, value)
            }
            child.total = Object.values(child.byPeriod).reduce((sum, value) => sum + value, 0)
        }
        node.total = Object.values(node.byPeriod).reduce((sum, value) => sum + value, 0)
        return node
    })

    summary.savings = accounts.map((account) => {
        const byPeriod: Record<string, number> = {}
        for (const period of ordered) {
            const amount = calcSavingsAllocatedInPeriod(period, account.id)
                + calcSavingsDeltaInPeriod(period, account.id)
            if (amount) byPeriod[period._id] = amount
        }
        const balance = calcSavingsBalance(ordered, account).balance
        return {
            accountId: account.id,
            name: account.name,
            byPeriod,
            total: Object.values(byPeriod).reduce((sum, value) => sum + value, 0),
            balance,
        }
    })

    return summary
}
