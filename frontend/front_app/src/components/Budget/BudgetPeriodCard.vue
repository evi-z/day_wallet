<template>
    <q-card flat bordered class="period-card">
        <div v-if="!ready" class="period-skeleton">
            <q-skeleton type="text" width="180px" />
        </div>

        <template v-else>
            <div class="period-head">
                <q-btn flat round dense size="sm" class="period-toggle"
                    :icon="collapsed ? 'sym_o_expand_more' : 'sym_o_expand_less'"
                    :aria-label="collapsed ? 'Развернуть период' : 'Свернуть период'" @click="toggleCollapsed" />

                <q-input v-model="period.label" dense borderless class="period-label"
                    placeholder="Название периода" />

                <div class="period-chips">
                    <span v-if="period.incomes.length === 1" class="period-income-label">Доход</span>
                    <MoneyInput v-if="period.incomes.length === 1" v-model="period.incomes[0]!.amount"
                        class="period-income budget-field" dense outlined />
                    <span v-else class="chip chip--muted">Доход {{ formatMoney(totals.incomeTotal) }}</span>
                    <span class="chip chip--muted">Распределено {{ formatMoney(totals.allocatedTotal) }}</span>
                    <span class="chip" :class="totals.freeTotal < 0 ? 'chip--negative' : 'chip--positive'">
                        Свободно {{ formatMoney(totals.freeTotal) }}
                    </span>
                </div>

                <q-btn flat round dense icon="sym_o_more_horiz" class="period-menu">
                    <q-menu>
                        <q-list dense style="min-width: 220px">
                            <q-item clickable v-close-popup @click="makeTemplate">
                                <q-item-section avatar><q-icon name="sym_o_bookmark_added" size="18px" /></q-item-section>
                                <q-item-section>Сделать шаблоном</q-item-section>
                            </q-item>
                            <q-separator />
                            <q-item clickable v-close-popup @click="confirmDelete">
                                <q-item-section avatar><q-icon name="sym_o_delete" size="18px" color="negative" /></q-item-section>
                                <q-item-section class="text-negative">Удалить период</q-item-section>
                            </q-item>
                        </q-list>
                    </q-menu>
                </q-btn>
            </div>

            <div v-show="!collapsed">
                <q-separator />

                <div class="period-body">
                    <div class="section-head">
                        <div class="section-label">Приходы</div>
                        <q-btn flat round dense size="sm" icon="sym_o_add" class="section-add"
                            aria-label="Добавить приход" @click="addIncome">
                            <q-tooltip>Добавить приход</q-tooltip>
                        </q-btn>
                    </div>
                    <div class="income-list">
                        <BudgetIncomeBlock v-for="income in period.incomes" :key="income.id" :income="income"
                            :period="period" :accounts="accounts" :ensure-account="ensureAccount"
                            :show-amount="period.incomes.length > 1" :show-totals="period.incomes.length > 1"
                            @remove="removeIncome" />
                    </div>
                    <template v-if="accounts.length">
                        <div class="section-label section-label--savings">Сбережения</div>
                        <div class="savings-line savings-line--head">
                            <span>Счёт</span>
                            <span class="savings-head__metric">из приходов</span>
                            <span class="savings-head__metric">доп. пополнение</span>
                            <span class="savings-head__metric">остаток</span>
                            <span />
                        </div>
                        <div v-for="account in accounts" :key="account.id" class="savings-line">
                            <div class="savings-line__name">
                                <q-icon name="sym_o_savings" size="15px" class="savings-line__icon" />
                                <span>{{ account.name }}</span>
                                <span class="savings-line__leader" />
                            </div>
                            <div class="savings-line__metric">
                                <span class="savings-line__label">из приходов</span>
                                <span class="savings-line__value">{{ formatMoney(savings[account.id]?.allocated ?? 0) }}</span>
                            </div>
                            <div class="savings-line__metric">
                                <span class="savings-line__label">доп. пополнение</span>
                                <MoneyInput :model-value="deltaOf(account.id)" dense outlined
                                    class="savings-line__input budget-field"
                                    @update:model-value="value => setDelta(account.id, value)" />
                            </div>
                            <div class="savings-line__metric savings-line__metric--balance">
                                <span class="savings-line__label">остаток</span>
                                <span class="savings-line__value">{{ formatMoney(savings[account.id]?.balance ?? 0) }}</span>
                            </div>
                        </div>
                    </template>

                    <q-input v-model="period.notes" type="textarea" autogrow outlined dense
                        label="Заметки периода" class="period-notes" />
                </div>
            </div>
        </template>
    </q-card>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import MoneyInput from 'src/components/MoneyInput/index.vue';
import BudgetIncomeBlock from './BudgetIncomeBlock.vue';
import { useBudgetPeriodRef } from 'src/services/database/wrappers/budget';
import {
    calcPeriodTotals,
    calcSavingsAllocatedInPeriod,
    calcSavingsBalanceUpTo,
    calcSavingsDeltaInPeriod,
} from 'src/domain/budget/calc';
import { formatMoney } from 'src/domain/budget/format';
import { createIncome } from 'src/domain/budget/defaults';
import type { BudgetCategory, BudgetIncome, BudgetSavingsAccount } from 'src/domain/budget/types';
import type { BudgetPeriodDBData } from 'src/models/database';

const props = defineProps<{
    docId: string,
    periods: BudgetPeriodDBData[],
    accounts: BudgetSavingsAccount[],
    ensureAccount: (name: string) => string,
    isLatest?: boolean,
}>()

const emit = defineEmits<{
    delete: [docId: string],
    changed: [],
    'make-template': [categories: BudgetCategory[]],
}>()

const $q = useQuasar()
const periodRef = useBudgetPeriodRef(props.docId)
const ready = ref(false)

const storageKey = `day-wallet:budget-collapsed:${props.docId}`
const collapsed = ref(false)

const period = computed(() => periodRef.value)
const totals = computed(() => calcPeriodTotals(period.value))

const savings = computed(() => {
    const own = { ...period.value, _id: props.docId }
    const all = [...props.periods.filter(item => item._id !== props.docId), own]
    const result: Record<string, { allocated: number, balance: number }> = {}
    for (const account of props.accounts) {
        result[account.id] = {
            allocated: calcSavingsAllocatedInPeriod(period.value, account.id),
            balance: calcSavingsBalanceUpTo(all, account, props.docId),
        }
    }
    return result
})

const deltaOf = (accountId: string) => calcSavingsDeltaInPeriod(period.value, accountId)

const setDelta = (accountId: string, value: number) => {
    if (!period.value.savingsDeltas) period.value.savingsDeltas = {}
    if (value) period.value.savingsDeltas[accountId] = value
    else delete period.value.savingsDeltas[accountId]
}

const notifyChanged = async () => { emit('changed') }

const applyDefaultCollapsed = () => {
    const stored = localStorage.getItem(storageKey)
    if (stored !== null) {
        collapsed.value = stored === '1'
        return
    }
    collapsed.value = !props.isLatest
}

onMounted(async () => {
    try {
        await periodRef.initFromDB()
        ready.value = true
        applyDefaultCollapsed()
        periodRef.bindValuesWatcher(notifyChanged)
    } catch (error) {
        console.error('Не удалось открыть период бюджета:', error)
        $q.notify({ type: 'negative', message: 'Не удалось открыть период бюджета' })
    }
})

onBeforeUnmount(() => periodRef.unbindValuesWatcher(notifyChanged))

watch(() => props.isLatest, () => applyDefaultCollapsed())

const toggleCollapsed = () => {
    collapsed.value = !collapsed.value
    try { localStorage.setItem(storageKey, collapsed.value ? '1' : '0') } catch { /* приватный режим */ }
}

const addIncome = () => {
    period.value.incomes.push(createIncome('Приход', 0))
}

const removeIncome = (income: BudgetIncome) => {
    const index = period.value.incomes.findIndex(item => item.id === income.id)
    if (index !== -1) period.value.incomes.splice(index, 1)
}

const makeTemplate = () => {
    $q.dialog({
        title: 'Сделать шаблоном?',
        message: 'Новые периоды будут начинаться с этого набора статей и подстатей.',
        cancel: { label: 'Отмена', flat: true },
        ok: { label: 'Сохранить шаблон', color: 'primary', flat: true },
    }).onOk(() => emit('make-template', period.value.categories))
}

const confirmDelete = () => {
    $q.dialog({
        title: 'Удалить период?',
        message: `«${period.value.label || 'Период'}» со всеми приходами и распределениями будет удалён.`,
        cancel: { label: 'Отмена', flat: true },
        ok: { label: 'Удалить', color: 'negative', flat: true },
        persistent: true,
    }).onOk(() => emit('delete', props.docId))
}
</script>

<style lang="scss" scoped>
.period-card {
    border-radius: 10px;
}

.period-skeleton {
    padding: 14px 16px;
}

.period-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    padding: 6px 10px 6px 8px;
}

.period-toggle {
    color: #6b7280;
}

.period-label {
    flex: 0 1 auto;
    min-width: 140px;
    font-size: 15px;
    font-weight: 600;
}

.period-label :deep(.q-field__control) {
    height: 30px;
    min-height: 30px;
}

.period-label :deep(input) {
    font-size: 14px;
    font-weight: 600;
}

.period-chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin-left: auto;
}

.period-income {
    flex: 0 0 132px;
    width: 132px;
    margin-right: 4px;
}

.period-income :deep(.q-field__control) {
    height: 30px;
    min-height: 30px;
}

.period-income :deep(.q-field__marginal) {
    height: 30px;
}

.period-income-label {
    color: #9ca3af;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.chip {
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 11px;
    line-height: 18px;
    white-space: nowrap;
}

.chip--muted {
    color: #4b5563;
    background: #f3f4f6;
}

.chip--positive {
    color: #065f46;
    background: #ecfdf5;
}

.chip--negative {
    color: #b91c1c;
    background: #fef2f2;
}

.period-menu {
    flex: 0 0 auto;
    color: #6b7280;
}

.period-body {
    padding: 8px 14px 12px;
}

.section-label {
    margin-bottom: 4px;
    color: #6b7280;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
}

.income-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
}

.section-head .section-label {
    margin-bottom: 0;
}

.section-add {
    color: #4b5563;
}

.section-label--savings {
    margin-top: 12px;
}

.savings-line {
    display: grid;
    width: 100%;
    grid-template-columns: minmax(180px, 1fr) 110px 160px 120px 28px;
    gap: 12px;
    align-items: center;
    padding: 4px 6px;
    border-radius: 4px;
    border-bottom: 1px solid #f5f7f9;
}

.savings-line--head {
    min-height: 22px;
    padding-top: 0;
    padding-bottom: 0;
    border-bottom: none;
    color: #9ca3af;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.savings-head__metric {
    text-align: right;
}

.savings-line__name {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    color: #1f2937;
    font-size: 13px;
}

.savings-line__name span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.savings-line__leader {
    flex: 1 1 auto;
    align-self: center;
    margin-left: 8px;
    border-bottom: 1px dotted #d5dbe3;
}

.savings-line__icon {
    color: #0f766e;
}

.savings-line__metric {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
    text-align: right;
}

.savings-line__label {
    display: none;
    color: #9ca3af;
    font-size: 10px;
}

.savings-line__value {
    color: #111827;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    text-align: right;
}

.savings-line__metric--balance .savings-line__value {
    font-weight: 600;
}

.savings-line__input {
    width: 100%;
}

.savings-line__input :deep(.q-field__control) {
    height: 30px;
    min-height: 30px;
}

.savings-line__input :deep(.q-field__marginal) {
    height: 30px;
}

.period-notes {
    margin-top: 10px;
}

@media (max-width: 767px) {
    .period-body {
        padding: 6px 10px 10px;
    }

    .period-label {
        flex: 1 1 150px;
    }

    .period-chips {
        order: 5;
        width: 100%;
        margin-left: 0;
    }

    .savings-line {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        row-gap: 4px;
    }

    .savings-line--head {
        display: none;
    }

    .savings-line__label {
        display: block;
    }

    .savings-line__leader {
        display: none;
    }

    .savings-line__name {
        grid-column: 1 / -1;
    }
}
</style>
