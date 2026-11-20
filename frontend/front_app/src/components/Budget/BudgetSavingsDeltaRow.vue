<template>
    <div v-if="ready" class="delta-row">
        <div class="delta-period">{{ period.label }}</div>
        <div class="delta-metric">
            <span class="delta-label">из приходов</span>
            <span class="delta-value">{{ formatMoney(allocated) }}</span>
        </div>
        <div class="delta-metric">
            <span class="delta-label">доп. пополнение</span>
            <MoneyInput :model-value="delta" dense outlined class="delta-input budget-field"
                @update:model-value="setDelta" />
        </div>
        <div class="delta-metric delta-metric--balance">
            <span class="delta-label">остаток</span>
            <span class="delta-value">{{ formatMoney(balance) }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import MoneyInput from 'src/components/MoneyInput/index.vue';
import { useBudgetPeriodRef } from 'src/services/database/wrappers/budget';
import {
    calcSavingsAllocatedInPeriod,
    calcSavingsBalanceUpTo,
    calcSavingsDeltaInPeriod,
} from 'src/domain/budget/calc';
import { formatMoney } from 'src/domain/budget/format';
import type { BudgetSavingsAccount } from 'src/domain/budget/types';
import type { BudgetPeriodDBData } from 'src/models/database';

const props = defineProps<{
    periodId: string,
    periods: BudgetPeriodDBData[],
    account: BudgetSavingsAccount,
}>()

const emit = defineEmits<{ changed: [] }>()

const periodRef = useBudgetPeriodRef(props.periodId)
const ready = ref(false)

const period = computed(() => periodRef.value)
const allocated = computed(() => calcSavingsAllocatedInPeriod(period.value, props.account.id))
const delta = computed(() => calcSavingsDeltaInPeriod(period.value, props.account.id))
const balance = computed(() => {
    const own = { ...period.value, _id: props.periodId }
    const all = [...props.periods.filter(item => item._id !== props.periodId), own]
    return calcSavingsBalanceUpTo(all, props.account, props.periodId)
})

const setDelta = (value: number) => {
    if (!period.value.savingsDeltas) period.value.savingsDeltas = {}
    if (value) period.value.savingsDeltas[props.account.id] = value
    else delete period.value.savingsDeltas[props.account.id]
}

const notifyChanged = async () => { emit('changed') }

onMounted(async () => {
    try {
        await periodRef.initFromDB()
        ready.value = true
        periodRef.bindValuesWatcher(notifyChanged)
    } catch (error) {
        console.error('Не удалось открыть период для пополнения:', error)
    }
})

onBeforeUnmount(() => periodRef.unbindValuesWatcher(notifyChanged))
</script>

<style lang="scss" scoped>
.delta-row {
    display: grid;
    grid-template-columns: 150px 110px 160px 120px;
    gap: 16px;
    align-items: center;
    justify-content: start;
    padding: 5px 0 5px 28px;
    border-bottom: 1px solid #f1f5f9;
    background: #fafcfb;
}

.delta-period {
    color: #374151;
    font-size: 12.5px;
}

.delta-metric {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
}

.delta-label {
    color: #9ca3af;
    font-size: 10px;
}

.delta-value {
    color: #111827;
    font-size: 12.5px;
    font-variant-numeric: tabular-nums;
}

.delta-metric--balance .delta-value {
    font-weight: 600;
}

@media (max-width: 767px) {
    .delta-row {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        padding-left: 12px;
        row-gap: 6px;
    }

    .delta-period {
        grid-column: 1 / -1;
    }
}
</style>
