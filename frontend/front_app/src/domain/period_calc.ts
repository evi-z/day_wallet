/**
 * Чистый расчёт периода Day Wallet.
 *
 * Модуль не зависит от Vue, PouchDB и браузера, поэтому его можно
 * проверять обычными unit-тестами. Все суммы считаются в рублях,
 * планы — в целых рублях.
 */

export type PeriodCalcDay = {
    /** ISO-дата YYYY-MM-DD — по ней сравниваем дни */
    iso: string,
    /** Дата в формате DD.MM.YYYY — по ней хранятся факты в БД */
    friendly: string,
    isWeekend: boolean,
}

export type PeriodCalcInput = {
    days: PeriodCalcDay[],
    budget: number,
    weekendPlan: number,
    facts: Record<string, number | undefined>,
    /** Сегодняшняя ISO-дата */
    todayIso: string,
}

export type PeriodCalcSummary = {
    totalDays: number,
    weekendDays: number,
    weekdayDays: number,
    totalWeekendsBudget: number,
    totalWeekdaysBudget: number,
    initialPlan: number,

    daysRemaining: number,
    weekendsRemaining: number,
    weekdaysRemaining: number,
    spentTotal: number,
    spentOnWeekends: number,
    spentOnWeekdays: number,
    spentToday: number,
    totalRemaining: number,
    remainingForWeekends: number,
    remainingForWeekdays: number,
    planForToday: number,
    remainingToday: number,
}

export type PeriodCalcResult = {
    /** План по каждому дню периода, в том же порядке, что и input.days */
    plans: number[],
    summary: PeriodCalcSummary,
}

const toFiniteNumber = (value: unknown): number => {
    const num = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(num) ? num : 0
}

const roundMoney = (value: number): number => Math.round(value * 100) / 100

const emptySummary = (): PeriodCalcSummary => ({
    totalDays: 0,
    weekendDays: 0,
    weekdayDays: 0,
    totalWeekendsBudget: 0,
    totalWeekdaysBudget: 0,
    initialPlan: 0,
    daysRemaining: 0,
    weekendsRemaining: 0,
    weekdaysRemaining: 0,
    spentTotal: 0,
    spentOnWeekends: 0,
    spentOnWeekdays: 0,
    spentToday: 0,
    totalRemaining: 0,
    remainingForWeekends: 0,
    remainingForWeekdays: 0,
    planForToday: 0,
    remainingToday: 0,
})

/**
 * Считает планы дней и сводку текущего состояния.
 *
 * Границы:
 * - «сегодня» включается в потраченное: факт текущего дня сразу уменьшает остаток;
 * - план дня считается по фактам строго до этого дня, чтобы не вычитать
 *   сегодняшнюю трату дважды;
 * - будущие факты хранятся, но в сводку не попадают;
 * - для закрытого периода учитываются все его факты, включая последний день.
 */
export const calculatePeriod = (input: PeriodCalcInput): PeriodCalcResult => {
    const days = input.days
    const totalDays = days.length
    const budget = toFiniteNumber(input.budget)
    const weekendPlan = toFiniteNumber(input.weekendPlan)

    const factOf = (day: PeriodCalcDay): number => toFiniteNumber(input.facts[day.friendly])

    if (totalDays === 0) return { plans: [], summary: emptySummary() }

    const weekendDays = days.filter(day => day.isWeekend).length
    const weekdayDays = totalDays - weekendDays
    const totalWeekendsBudget = weekendDays * weekendPlan
    const totalWeekdaysBudget = budget - totalWeekendsBudget
    const initialPlan = weekdayDays > 0 ? Math.round(totalWeekdaysBudget / weekdayDays) : 0

    const todayIndex = days.findIndex(day => day.iso === input.todayIso)
    const firstDay = days[0]!
    const lastDay = days[totalDays - 1]!
    const isBeforePeriod = todayIndex === -1 && input.todayIso < firstDay.iso
    const isAfterPeriod = todayIndex === -1 && input.todayIso > lastDay.iso
    /** Последний день, который уже наступил (включительно) */
    const cutoffIndex = todayIndex !== -1 ? todayIndex : (isAfterPeriod ? totalDays - 1 : -1)

    const plans: number[] = new Array(totalDays).fill(0)
    let lastWeekdayPlan = initialPlan

    for (let index = 0; index < totalDays; index++) {
        const day = days[index]!

        if (index > cutoffIndex) {
            plans[index] = day.isWeekend ? weekendPlan : lastWeekdayPlan
            continue
        }

        if (day.isWeekend) {
            plans[index] = weekendPlan
            continue
        }

        let remainingWeekends = 0
        let remainingWeekdays = 0
        for (let i = index; i < totalDays; i++) {
            if (days[i]!.isWeekend) remainingWeekends++
            else remainingWeekdays++
        }

        let spentBefore = 0
        for (let i = 0; i < index; i++) spentBefore += factOf(days[i]!)

        // Если обычных дней не осталось, делить не на что: план 0, а не Infinity/NaN.
        plans[index] = remainingWeekdays > 0
            ? Math.round((budget - spentBefore - remainingWeekends * weekendPlan) / remainingWeekdays)
            : 0
        lastWeekdayPlan = plans[index]!
    }

    let spentTotal = 0
    let spentOnWeekends = 0
    let spentOnWeekdays = 0
    for (let index = 0; index <= cutoffIndex; index++) {
        const day = days[index]!
        const fact = factOf(day)
        spentTotal += fact
        if (day.isWeekend) spentOnWeekends += fact
        else spentOnWeekdays += fact
    }

    const daysRemaining = todayIndex !== -1
        ? totalDays - todayIndex
        : (isBeforePeriod ? totalDays : 0)

    let weekendsRemaining = 0
    if (daysRemaining > 0) {
        const startIndex = todayIndex !== -1 ? todayIndex : 0
        for (let index = startIndex; index < totalDays; index++) {
            if (days[index]!.isWeekend) weekendsRemaining++
        }
    }
    const weekdaysRemaining = daysRemaining - weekendsRemaining

    const spentToday = todayIndex !== -1 ? factOf(days[todayIndex]!) : 0
    const planForToday = todayIndex !== -1
        ? plans[todayIndex]!
        : (isBeforePeriod ? plans[0]! : 0)

    const totalRemaining = roundMoney(budget - spentTotal)
    const remainingForWeekends = Math.max(
        0,
        Math.min(weekendsRemaining * weekendPlan, totalRemaining)
    )
    const remainingForWeekdays = roundMoney(totalRemaining - remainingForWeekends)

    return {
        plans,
        summary: {
            totalDays,
            weekendDays,
            weekdayDays,
            totalWeekendsBudget,
            totalWeekdaysBudget,
            initialPlan,

            daysRemaining,
            weekendsRemaining,
            weekdaysRemaining,
            spentTotal: roundMoney(spentTotal),
            spentOnWeekends: roundMoney(spentOnWeekends),
            spentOnWeekdays: roundMoney(spentOnWeekdays),
            spentToday: roundMoney(spentToday),
            totalRemaining,
            remainingForWeekends,
            remainingForWeekdays,
            planForToday,
            remainingToday: roundMoney(planForToday - spentToday),
        },
    }
}
