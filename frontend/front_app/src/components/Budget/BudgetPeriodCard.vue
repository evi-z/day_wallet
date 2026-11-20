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
                        class="period-income" dense outlined />
                    <span v-else class="chip chip--muted">Доход {{ formatMoney(totals.incomeTotal) }}</span>
                    <span class="chip chip--muted">Распределено {{ formatMoney(totals.allocatedTotal) }}</span>
                    <span class="chip" :class="totals.freeTotal < 0 ? 'chip--negative' : 'chip--positive'">
                        Свободно {{ formatMoney(totals.freeTotal) }}
                    </span>
                </div>

                <q-btn flat round dense icon="sym_o_more_horiz" class="period-menu">
                    <q-menu>
                        <q-list dense style="min-width: 220px">
                            <q-item clickable v-close-popup @click="openStructure">
                                <q-item-section avatar><q-icon name="sym_o_account_tree" size="18px" /></q-item-section>
                                <q-item-section>Шаблоны и счета</q-item-section>
                            </q-item>
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
                    <div class="section-label">Приходы</div>
                    <div class="income-list">
                        <BudgetIncomeBlock v-for="income in period.incomes" :key="income.id" :income="income"
                            :period="period" :accounts="accounts" :ensure-account="ensureAccount"
                            :show-amount="period.incomes.length > 1" :show-totals="period.incomes.length > 1"
                            @remove="removeIncome" />
                    </div>
                    <q-btn flat dense no-caps color="primary" icon="sym_o_add" label="Добавить приход"
                        class="add-income" @click="addIncome" />

                    <div class="section-label section-label--savings">
                        Сбережения
                        <q-btn flat dense round size="sm" icon="sym_o_add" @click="addSavingsAccount">
                            <q-tooltip>Новый сберегательный счёт</q-tooltip>
                        </q-btn>
                    </div>

                    <div v-if="!accounts.length" class="savings-empty">
                        Сберегательных счетов пока нет. Создайте счёт и привяжите к статье через меню статьи.
                    </div>

                    <div v-for="account in accounts" :key="account.id" class="savings-row">
                        <div class="savings-name">
                            <q-icon name="sym_o_savings" size="16px" class="savings-icon" />
                            <span>{{ account.name }}</span>
                            <q-btn flat round dense size="xs" icon="sym_o_more_horiz" class="savings-menu">
                                <q-menu>
                                    <q-list dense>
                                        <q-item clickable v-close-popup @click="editInitialBalance(account)">
                                            <q-item-section>Начальный остаток</q-item-section>
                                        </q-item>
                                        <q-item clickable v-close-popup @click="removeAccount(account)">
                                            <q-item-section>Удалить счёт</q-item-section>
                                        </q-item>
                                    </q-list>
                                </q-menu>
                            </q-btn>
                        </div>
                        <div class="savings-metric">
                            <span class="savings-metric__label">из приходов</span>
                            <span class="savings-metric__value">{{ formatMoney(savings[account.id]?.allocatedInPeriod ?? 0) }}</span>
                        </div>
                        <div class="savings-delta">
                            <span class="savings-metric__label">доп. пополнение</span>
                            <MoneyInput :model-value="deltaOf(account.id)" dense outlined
                                class="savings-delta__input" @update:model-value="value => setDelta(account.id, value)" />
                        </div>
                        <div class="savings-balance">
                            <span class="savings-metric__label">остаток</span>
                            <span class="savings-metric__value">{{ formatMoney(savings[account.id]?.balance ?? 0) }}</span>
                        </div>
                    </div>

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
import { useRouter } from 'vue-router';
import MoneyInput from 'src/components/MoneyInput/index.vue';
import BudgetIncomeBlock from './BudgetIncomeBlock.vue';
import { useBudgetPeriodRef } from 'src/services/database/wrappers/budget';
import {
    calcAllSavingsBalances,
    calcPeriodTotals,
    isSavingsAccountUsed,
    listLeaves,
} from 'src/domain/budget/calc';
import { formatMoney } from 'src/domain/budget/format';
import { createBudgetId, createIncome } from 'src/domain/budget/defaults';
import type { BudgetCategory, BudgetIncome, BudgetSavingsAccount } from 'src/domain/budget/types';
import type { BudgetPeriodDBData } from 'src/models/database';
import { PAGES } from 'src/router/models';

const props = defineProps<{
    docId: string,
    periods: BudgetPeriodDBData[],
    accounts: BudgetSavingsAccount[],
    ensureAccount: (name: string) => string,
    removeAccount: (accountId: string) => void,
    setAccountInitial: (accountId: string, value: number) => void,
    isLatest?: boolean,
}>()

const emit = defineEmits<{
    delete: [docId: string],
    changed: [],
    'make-template': [categories: BudgetCategory[]],
}>()

const $q = useQuasar()
const $router = useRouter()
const periodRef = useBudgetPeriodRef(props.docId)
const ready = ref(false)

const storageKey = `day-wallet:budget-collapsed:${props.docId}`
const collapsed = ref(false)

const period = computed(() => periodRef.value)
const totals = computed(() => calcPeriodTotals(period.value))

const savings = computed(() => {
    const own = { ...period.value, _id: props.docId }
    const others = props.periods.filter(item => item._id !== props.docId)
    return calcAllSavingsBalances([...others, own], props.accounts, own)
})

const notifyChanged = async () => { emit('changed') }

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

const applyDefaultCollapsed = () => {
    const stored = localStorage.getItem(storageKey)
    if (stored !== null) {
        collapsed.value = stored === '1'
        return
    }
    collapsed.value = !props.isLatest
}

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

const openStructure = () => {
    void $router.push({ name: PAGES.BudgetStructure })
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

const deltaOf = (accountId: string) => period.value.savingsDeltas?.[accountId] ?? 0

const setDelta = (accountId: string, value: number) => {
    if (!period.value.savingsDeltas) period.value.savingsDeltas = {}
    if (value) period.value.savingsDeltas[accountId] = value
    else delete period.value.savingsDeltas[accountId]
}

const accountLinked = (accountId: string) => listLeaves(period.value.categories)
    .some(leaf => leaf.savingsAccountId === accountId)

const addSavingsAccount = () => {
    $q.dialog({
        title: 'Новый сберегательный счёт',
        message: 'Например, «Подушка» или «Авто». В этом периоде появится связанная статья.',
        prompt: {
            model: '',
            type: 'text',
            isValid: value => !!String(value).trim(),
        },
        cancel: { label: 'Отмена', flat: true },
        ok: { label: 'Создать', color: 'primary', flat: true },
        persistent: true,
    }).onOk((name: string) => {
        const trimmed = String(name).trim()
        const accountId = props.ensureAccount(trimmed)
        if (!accountLinked(accountId)) {
            period.value.categories.push({
                id: createBudgetId(),
                name: trimmed,
                children: [],
                savingsAccountId: accountId,
            })
        }
    })
}

const removeAccount = (account: BudgetSavingsAccount) => {
    const all = [...props.periods.filter(item => item._id !== props.docId), { ...period.value, _id: props.docId }]
    if (isSavingsAccountUsed(all, account.id)) {
        $q.notify({
            type: 'warning',
            message: 'У счёта есть распределения или пополнения. Удаление скрыло бы эти суммы.',
        })
        return
    }

    const linked = all.some(item => listLeaves(item.categories)
        .some(leaf => leaf.savingsAccountId === account.id))
    if (linked) {
        $q.notify({
            type: 'warning',
            message: 'Счёт привязан к статье. Сначала выберите «Без счёта» в меню статьи.',
        })
        return
    }

    $q.dialog({
        title: 'Удалить сберегательный счёт?',
        message: `«${account.name}» будет удалён из настроек. Статьи, привязанные к нему, останутся.`,
        cancel: { label: 'Отмена', flat: true },
        ok: { label: 'Удалить', color: 'negative', flat: true },
        persistent: true,
    }).onOk(() => props.removeAccount(account.id))
}

const editInitialBalance = (account: BudgetSavingsAccount) => {
    $q.dialog({
        title: 'Начальный остаток',
        message: `Сколько уже было на счёте «${account.name}» до начала учёта в приложении?`,
        prompt: {
            model: String(account.initialBalance || 0),
            type: 'number',
        },
        cancel: { label: 'Отмена', flat: true },
        ok: { label: 'Сохранить', color: 'primary', flat: true },
        persistent: true,
    }).onOk((value: string | number) => {
        props.setAccountInitial(account.id, Number(value) || 0)
    })
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

.period-label :deep(input) {
    font-weight: 600;
}

.period-label :deep(.q-field__control) {
    height: 30px;
    min-height: 30px;
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

.period-income-label {
    color: #9ca3af;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.period-income :deep(.q-field__control) {
    height: 30px;
    min-height: 30px;
}

.period-income :deep(.q-field__marginal) {
    height: 30px;
}

.period-income :deep(input) {
    font-size: 12.5px;
    font-weight: 600;
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
    display: flex;
    align-items: center;
    gap: 2px;
    margin-bottom: 4px;
    color: #6b7280;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
}

.section-label--savings {
    margin-top: 12px;
}

.income-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.add-income {
    margin-top: 2px;
}

.savings-empty {
    color: #6b7280;
    font-size: 12px;
    line-height: 1.45;
}

.savings-row {
    display: grid;
    grid-template-columns: minmax(130px, 1.2fr) minmax(100px, 0.8fr) 150px minmax(110px, 0.8fr);
    gap: 10px;
    align-items: center;
    padding: 4px 0;
    border-bottom: 1px solid #f1f5f9;
}

.savings-name {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    font-size: 13px;
    color: #1f2937;
}

.savings-name span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.savings-icon {
    color: #0f766e;
}

.savings-menu {
    color: #9ca3af;
}

.savings-metric,
.savings-delta,
.savings-balance {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
}

.savings-metric__label {
    color: #9ca3af;
    font-size: 10px;
    line-height: 1.2;
}

.savings-metric__value {
    color: #111827;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
}

.savings-balance .savings-metric__value {
    font-weight: 600;
}

.savings-delta__input :deep(.q-field__control) {
    height: 30px;
    min-height: 30px;
}

.savings-delta__input :deep(.q-field__marginal) {
    height: 30px;
}

.savings-delta__input :deep(input) {
    font-size: 12.5px;
}

.period-notes {
    margin-top: 12px;
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

    .savings-row {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        row-gap: 6px;
    }

    .savings-name {
        grid-column: 1 / -1;
    }
}
</style>
