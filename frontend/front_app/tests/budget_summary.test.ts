import test from 'node:test'
import assert from 'node:assert/strict'

import { calcBudgetSummary } from '../src/domain/budget/summary.ts'
import type { BudgetPeriodData, BudgetSavingsAccount } from '../src/domain/budget/types.ts'

const account: BudgetSavingsAccount = {
    id: 'acc-pillow',
    name: 'Подушка',
    initialBalance: 100000,
    createdAt: '2026-01-01T00:00:00.000Z',
}

const makePeriod = (id: string, seq: number, label: string, overrides: Partial<BudgetPeriodData> = {}): BudgetPeriodData & { _id: string } => ({
    _id: id,
    label,
    seq,
    incomes: [],
    categories: [
        { id: 'cat-life', name: 'Жизнь', children: [] },
        {
            id: 'cat-savings',
            name: 'Буфер',
            children: [{ id: 'sub-pillow', name: 'Подушка', savingsAccountId: 'acc-pillow' }],
        },
    ],
    savingsDeltas: {},
    notes: '',
    ...overrides,
})

test('сводка раскладывает распределения по периодам и считает итог', () => {
    const first = makePeriod('p1', 1, 'Октябрь', {
        incomes: [{ id: 'i1', name: 'Зарплата', amount: 100000, allocations: { 'cat-life': 20000, 'sub-pillow': 10000 } }],
    })
    const second = makePeriod('p2', 2, 'Ноябрь', {
        incomes: [{ id: 'i2', name: 'Зарплата', amount: 120000, allocations: { 'cat-life': 25000, 'sub-pillow': 5000 } }],
        savingsDeltas: { 'acc-pillow': 1500 },
    })

    const summary = calcBudgetSummary([second, first], [account])
    assert.deepEqual(summary.periodIds, ['p1', 'p2'])
    assert.deepEqual(summary.periodLabels, ['Октябрь', 'Ноябрь'])

    const life = summary.categories.find(category => category.id === 'cat-life')!
    assert.deepEqual(life.byPeriod, { p1: 20000, p2: 25000 })
    assert.equal(life.total, 45000)

    const buffer = summary.categories.find(category => category.id === 'cat-savings')!
    assert.deepEqual(buffer.byPeriod, { p1: 10000, p2: 5000 })
    assert.equal(buffer.children[0]!.name, 'Подушка')
    assert.equal(buffer.children[0]!.isSavings, true)

    assert.equal(summary.incomeByPeriod['p2'], 120000)
    assert.equal(summary.allocatedByPeriod['p2'], 30000)
    assert.equal(summary.freeByPeriod['p2'], 90000)
})

test('сводка сбережений учитывает распределения и ручное пополнение', () => {
    const first = makePeriod('p1', 1, 'Октябрь', {
        incomes: [{ id: 'i1', name: 'Зарплата', amount: 100000, allocations: { 'sub-pillow': 10000 } }],
    })
    const second = makePeriod('p2', 2, 'Ноябрь', {
        incomes: [{ id: 'i2', name: 'Зарплата', amount: 120000, allocations: { 'sub-pillow': 5000 } }],
        savingsDeltas: { 'acc-pillow': 1500 },
    })

    const summary = calcBudgetSummary([first, second], [account])
    const row = summary.savings[0]!
    assert.deepEqual(row.byPeriod, { p1: 10000, p2: 6500 })
    assert.equal(row.total, 16500)
    assert.equal(row.balance, 116500)
})

test('статья, ставшая подстатьёй, не задваивает итог периода', () => {
    const first = makePeriod('p1', 1, 'Октябрь', {
        incomes: [{ id: 'i1', name: 'Зарплата', amount: 100000, allocations: { 'cat-savings': 5000 } }],
        categories: [{ id: 'cat-savings', name: 'Буфер', children: [] }],
    })
    const second = makePeriod('p2', 2, 'Ноябрь', {
        incomes: [{ id: 'i2', name: 'Зарплата', amount: 100000, allocations: { 'sub-pillow': 7000 } }],
    })

    const summary = calcBudgetSummary([first, second], [account])
    const buffer = summary.categories.find(category => category.id === 'cat-savings')!
    assert.deepEqual(buffer.byPeriod, { p1: 5000, p2: 7000 })
    assert.equal(buffer.total, 12000)
})
