<template>
    <div v-if="ready" class="savings-period">
        <div v-if="!accounts.length" class="savings-empty">
            Сберегательных счетов пока нет.
        </div>

        <div v-for="account in accounts" :key="account.id" class="savings-row">
            <div class="savings-name">
                <q-icon name="sym_o_savings" size="16px" class="savings-icon" />
                <span>{{ account.name }}</span>
            </div>
            <div class="savings-metric">
                <span class="savings-label">из приходов</span>
                <span class="savings-value">{{ formatMoney(allocatedOf(account.id)) }}</span>
            </div>
            <div class="savings-metric">
                <span class="savings-label">доп. пополнение</span>
                <MoneyInput :model-value="deltaOf(account.id)" dense outlined class="savings-input budget-field"
                    @update:model-value="value => setDelta(account.id, value)" />
            </div>
            <div class="savings-metric savings-metric--balance">
                <span class="savings-label">остаток</span>
                <span class="savings-value">{{ formatMoney(balanceOf(account.id)) }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import MoneyInput from 'src/components/MoneyInput/index.vue';
import { useBudgetPeriodRef } from 'src/services/database/wrappers/budget';
import { calcSavingsAllocatedInPeriod, calcSavingsBalance, calcSavingsDeltaInPeriod } from 'src/domain/budget/calc';
import { formatMoney } from 'src/domain/budget/format';
import type { BudgetSavingsAccount } from 'src/domain/budget/types';
import type { BudgetPeriodDBData } from 'src/models/database';

const props = defineProps<{
    periodId: string,
    periods: BudgetPeriodDBData[],
    accounts: BudgetSavingsAccount[],
}>()

const emit = defineEmits<{ changed: [] }>()

const $q = useQuasar()
const periodRef = useBudgetPeriodRef(props.periodId)
const ready = ref(false)

const period = computed(() => periodRef.value)

const allocatedOf = (accountId: string) => calcSavingsAllocatedInPeriod(period.value, accountId)

const balanceOf = (accountId: string) => {
    const account = props.accounts.find(item => item.id === accountId)
    if (!account) return 0
    const own = { ...period.value, _id: props.periodId }
    const others = props.periods.filter(item => item._id !== props.periodId)
    return calcSavingsBalance([...others, own], account).balance
}

const deltaOf = (accountId: string) => calcSavingsDeltaInPeriod(period.value, accountId)

const setDelta = (accountId: string, value: number) => {
    if (!period.value.savingsDeltas) period.value.savingsDeltas = {}
    if (value) period.value.savingsDeltas[accountId] = value
    else delete period.value.savingsDeltas[accountId]
}

const notifyChanged = async () => { emit('changed') }

onMounted(async () => {
    try {
        await periodRef.initFromDB()
        ready.value = true
        periodRef.bindValuesWatcher(notifyChanged)
    } catch (error) {
        console.error('Не удалось открыть период для сбережений:', error)
        $q.notify({ type: 'negative', message: 'Не удалось открыть период' })
    }
})

onBeforeUnmount(() => periodRef.unbindValuesWatcher(notifyChanged))
</script>

<style lang="scss" scoped>
.savings-period {
    display: flex;
    flex-direction: column;
}

.savings-empty {
    color: #6b7280;
    font-size: 12px;
}

.savings-row {
    display: grid;
    grid-template-columns: 240px 110px 160px 130px;
    gap: 16px;
    align-items: center;
    justify-content: start;
    padding: 6px 0;
    border-bottom: 1px solid #f1f5f9;
}

.savings-name {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    color: #1f2937;
    font-size: 13px;
}

.savings-name span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.savings-icon {
    color: #0f766e;
}

.savings-metric {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
}

.savings-label {
    color: #9ca3af;
    font-size: 10px;
}

.savings-value {
    color: #111827;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
}

.savings-metric--balance .savings-value {
    font-weight: 600;
}

@media (max-width: 767px) {
    .savings-row {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        justify-content: stretch;
        row-gap: 6px;
    }

    .savings-name {
        grid-column: 1 / -1;
    }
}
</style>
