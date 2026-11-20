import test from 'node:test'
import assert from 'node:assert/strict'

import {
    calcAllSavingsBalances,
    calcIncomeTotals,
    calcPeriodTotals,
    calcSavingsBalance,
    hasLeafAllocations,
    listLeaves,
} from '../src/domain/budget/calc.ts'
import { createDefaultCategories, createPeriodData, suggestNextLabel } from '../src/domain/budget/defaults.ts'
import type { BudgetPeriodData, BudgetSavingsAccount } from '../src/domain/budget/types.ts'

const account: BudgetSavingsAccount = {
    id: 'acc-pillow',
    name: 'Подушка',
    initialBalance: 200000,
    createdAt: '2026-01-01T00:00:00.000Z',
}

const period = (overrides: Partial<BudgetPeriodData> = {}): BudgetPeriodData => ({
    label: 'Ноябрь 2026',
    seq: 1,
    incomes: [],
    categories: [
        {
            id: 'cat-debts',
            name: 'Долги',
            children: [{ id: 'sub-credit', name: 'Автокредит' }],
        },
        { id: 'cat-life', name: 'Жизнь', children: [] },
        {
            id: 'cat-savings',
            name: 'Буфер НП',
            children: [{ id: 'sub-pillow', name: 'Подушка', savingsAccountId: 'acc-pillow' }],
        },
    ],
    savingsDeltas: {},
    notes: '',
    ...overrides,
})

test('листья дерева: подстатья, а без них — сама статья', () => {
    const leaves = listLeaves(period().categories)
    assert.deepEqual(leaves.map(leaf => leaf.id), ['sub-credit', 'cat-life', 'sub-pillow'])
    assert.equal(leaves[2]!.savingsAccountId, 'acc-pillow')
})

test('распределение принадлежит приходу, итог считается по всем приходам', () => {
    const p = period({
        incomes: [
            { id: 'inc-1', name: 'Аванс', amount: 60000, allocations: { 'sub-credit': 20000, 'cat-life': 15000 } },
            { id: 'inc-2', name: 'Зарплата', amount: 110000, allocations: { 'sub-credit': 4000, 'cat-life': 22000 } },
        ],
    })

    const first = calcIncomeTotals(p, p.incomes[0]!)
    assert.equal(first.allocated, 35000)
    assert.equal(first.free, 25000)

    const totals = calcPeriodTotals(p)
    assert.equal(totals.incomeTotal, 170000)
    assert.equal(totals.allocatedTotal, 61000)
    assert.equal(totals.freeTotal, 109000)
    assert.equal(totals.byLeaf['sub-credit'], 24000)
    assert.equal(totals.byLeaf['cat-life'], 37000)
    assert.equal(totals.byCategory['cat-debts'], 24000)
    assert.equal(totals.byCategory['cat-life'], 37000)
})

test('суммы по удалённым статьям не прячутся', () => {
    const p = period({
        incomes: [{
            id: 'inc-1',
            name: 'Зарплата',
            amount: 100000,
            allocations: { 'cat-life': 10000, 'deleted-leaf': 5000 },
        }],
    })

    const totals = calcPeriodTotals(p)
    assert.equal(totals.allocatedTotal, 15000)
    assert.equal(totals.orphanedTotal, 5000)
    assert.equal(totals.freeTotal, 85000)
})

test('сбережения: распределения и ручная дельта складываются в остаток', () => {
    const p = period({
        incomes: [{ id: 'inc-1', name: 'Зарплата', amount: 170000, allocations: { 'sub-pillow': 20000 } }],
        savingsDeltas: { 'acc-pillow': 1500 },
    })

    const result = calcSavingsBalance([p], account, p)
    assert.equal(result.allocatedInPeriod, 20000)
    assert.equal(result.deltaInPeriod, 1500)
    assert.equal(result.balance, 221500)
    assert.equal(result.history.length, 1)
})

test('дельта не меняет свободный остаток и распределения прихода', () => {
    const p = period({
        incomes: [{ id: 'inc-1', name: 'Зарплата', amount: 100000, allocations: { 'cat-life': 30000 } }],
        savingsDeltas: { 'acc-pillow': 1500 },
    })

    const totals = calcPeriodTotals(p)
    assert.equal(totals.freeTotal, 70000)
    assert.equal(totals.byLeaf['cat-life'], 30000)
    assert.equal(totals.byCategory['cat-savings'], undefined)
})

test('остаток сбережений накапливается по периодам в порядке seq', () => {
    const first = period({
        label: 'Октябрь 2026',
        seq: 1,
        incomes: [{ id: 'inc-a', name: 'Зарплата', amount: 100000, allocations: { 'sub-pillow': 10000 } }],
        savingsDeltas: { 'acc-pillow': 500 },
    })
    const second = period({
        label: 'Ноябрь 2026',
        seq: 2,
        incomes: [{ id: 'inc-b', name: 'Зарплата', amount: 100000, allocations: { 'sub-pillow': 5000 } }],
        savingsDeltas: { 'acc-pillow': 250 },
    })

    const result = calcSavingsBalance([second, first], account, second)
    assert.equal(result.balance, 215750)
    assert.deepEqual(result.history.map(entry => entry.label), ['Октябрь 2026', 'Ноябрь 2026'])
    assert.equal(result.history[1]!.balance, 215750)
})

test('период без пополнений не попадает в историю сбережений', () => {
    const first = period({ seq: 1 })
    const second = period({ seq: 2, label: 'Декабрь 2026' })
    assert.deepEqual(calcSavingsBalance([first, second], account).history, [])
})

test('несколько сберегательных счетов считаются независимо', () => {
    const secondAccount: BudgetSavingsAccount = {
        id: 'acc-car',
        name: 'Авто',
        initialBalance: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
    }
    const p = period({
        categories: [
            { id: 'cat-life', name: 'Жизнь', children: [] },
            {
                id: 'cat-savings',
                name: 'Спецсчета',
                children: [
                    { id: 'sub-pillow', name: 'Подушка', savingsAccountId: 'acc-pillow' },
                    { id: 'sub-car', name: 'Авто', savingsAccountId: 'acc-car' },
                ],
            },
        ],
        incomes: [{
            id: 'inc-1',
            name: 'Зарплата',
            amount: 100000,
            allocations: { 'sub-pillow': 10000, 'sub-car': 5000 },
        }],
        savingsDeltas: { 'acc-car': 700 },
    })

    const balances = calcAllSavingsBalances([p], [account, secondAccount], p)
    assert.equal(balances['acc-pillow']!.balance, 210000)
    assert.equal(balances['acc-car']!.balance, 5700)
    assert.equal(balances['acc-car']!.deltaInPeriod, 700)
})

test('новая статья из шаблона получает новые id, копия периода сохраняет связь', () => {
    const template = createDefaultCategories()
    const a = createPeriodData({ label: 'Ноябрь 2026', seq: 1, categories: template })
    const b = createPeriodData({ label: 'Декабрь 2026', seq: 2, categories: template })

    assert.deepEqual(b.categories.map(c => c.id), a.categories.map(c => c.id))
    assert.equal(a.incomes.length, 1)
    assert.equal(a.incomes[0]!.name, 'Зарплата')
})

test('подсказка следующего месяца', () => {
    assert.equal(suggestNextLabel([{ label: 'Ноябрь 2026' }]), 'Декабрь 2026')
    assert.equal(suggestNextLabel([{ label: 'Декабрь 2026' }]), 'Январь 2027')
    assert.equal(suggestNextLabel([{ label: 'Не месяц' }]), '')
})

test('проверка распределений по листу', () => {
    const p = period({
        incomes: [{ id: 'inc-1', name: 'Зарплата', amount: 1000, allocations: { 'cat-life': 300 } }],
    })
    assert.equal(hasLeafAllocations(p, 'cat-life'), true)
    assert.equal(hasLeafAllocations(p, 'cat-debts'), false)
})
