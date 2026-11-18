import test from 'node:test'
import assert from 'node:assert/strict'

import { calculatePeriod, type PeriodCalcDay } from '../src/domain/period_calc.ts'

const day = (iso: string, isWeekend: boolean): PeriodCalcDay => ({
    iso,
    friendly: iso.split('-').reverse().join('.'),
    isWeekend,
})

const money = (value: number) => Math.round(value * 100) / 100

test('факт сегодняшнего дня сразу уменьшает остаток', () => {
    const result = calculatePeriod({
        days: [
            day('2026-11-16', false),
            day('2026-11-17', false),
            day('2026-11-18', false),
        ],
        budget: 900,
        weekendPlan: 0,
        facts: { '16.11.2026': 100, '17.11.2026': 50 },
        todayIso: '2026-11-17',
    })

    assert.equal(result.summary.spentTotal, 150)
    assert.equal(result.summary.totalRemaining, 750)
    assert.equal(result.summary.spentToday, 50)
    assert.equal(result.summary.planForToday, 400)
    assert.equal(result.summary.remainingToday, 350)
    assert.deepEqual(result.plans.slice(0, 3), [300, 400, 400])
})

test('первый особый день получает план особого дня, а не initial_plan', () => {
    const result = calculatePeriod({
        days: [
            day('2026-11-20', true),
            day('2026-11-21', true),
            day('2026-11-22', false),
        ],
        budget: 900,
        weekendPlan: 100,
        facts: {},
        todayIso: '2026-11-20',
    })

    assert.deepEqual(result.plans, [100, 100, 700])
    assert.equal(result.summary.planForToday, 100)
})

test('период только из особых дней не даёт деления на ноль', () => {
    const result = calculatePeriod({
        days: [
            day('2026-11-20', true),
            day('2026-11-21', true),
        ],
        budget: 300,
        weekendPlan: 100,
        facts: {},
        todayIso: '2026-11-20',
    })

    assert.equal(result.summary.weekdayDays, 0)
    assert.equal(result.summary.initialPlan, 0)
    assert.deepEqual(result.plans, [100, 100])
    assert.ok(result.plans.every(Number.isFinite))
})

test('закрытый период не теряет факт последнего дня и не показывает отрицательные дни', () => {
    const result = calculatePeriod({
        days: [
            day('2026-11-16', false),
            day('2026-11-17', false),
        ],
        budget: 900,
        weekendPlan: 0,
        facts: { '16.11.2026': 100, '17.11.2026': 200 },
        todayIso: '2026-11-20',
    })

    assert.equal(result.summary.daysRemaining, 0)
    assert.equal(result.summary.spentTotal, 300)
    assert.equal(result.summary.totalRemaining, 600)
    assert.equal(result.summary.planForToday, 0)
})

test('будущие факты не попадают в итоги и не делают будни отрицательными', () => {
    const result = calculatePeriod({
        days: [
            day('2026-11-19', false),
            day('2026-11-20', true),
            day('2026-11-21', true),
            day('2026-11-22', false),
        ],
        budget: 900,
        weekendPlan: 100,
        facts: { '20.11.2026': 50 },
        todayIso: '2026-11-19',
    })

    assert.equal(result.summary.spentTotal, 0)
    assert.equal(result.summary.spentOnWeekends, 0)
    assert.equal(result.summary.spentOnWeekdays, 0)
})

test('копейки сохраняются в сумме', () => {
    const result = calculatePeriod({
        days: [day('2026-11-16', false), day('2026-11-17', false)],
        budget: 900,
        weekendPlan: 0,
        facts: { '16.11.2026': 100.25, '17.11.2026': 0.5 },
        todayIso: '2026-11-17',
    })

    assert.equal(result.summary.spentTotal, 100.75)
    assert.equal(result.summary.totalRemaining, money(799.25))
})

test('перерасход показывается отрицательным остатком', () => {
    const result = calculatePeriod({
        days: [day('2026-11-16', false), day('2026-11-17', false)],
        budget: 100,
        weekendPlan: 0,
        facts: { '16.11.2026': 150 },
        todayIso: '2026-11-16',
    })

    assert.equal(result.summary.totalRemaining, -50)
    assert.equal(result.summary.remainingForWeekends, 0)
    assert.equal(result.summary.remainingForWeekdays, -50)
})

test('период до начала показывает полный срок и нулевые траты', () => {
    const result = calculatePeriod({
        days: [
            day('2026-11-16', false),
            day('2026-11-17', false),
            day('2026-11-18', false),
        ],
        budget: 900,
        weekendPlan: 0,
        facts: { '16.11.2026': 100 },
        todayIso: '2026-11-10',
    })

    assert.equal(result.summary.daysRemaining, 3)
    assert.equal(result.summary.spentTotal, 0)
    assert.equal(result.summary.totalRemaining, 900)
    assert.equal(result.summary.planForToday, 300)
})
