<template>
    <div class="income" :class="{ 'income--collapsed': !expanded }">
        <div class="income-head" @click="expanded = !expanded">
            <q-btn flat round dense size="sm" class="income-toggle"
                :icon="expanded ? 'sym_o_expand_less' : 'sym_o_expand_more'"
                :aria-label="expanded ? 'Свернуть приход' : 'Раскрыть приход'" @click.stop="expanded = !expanded" />

            <q-input v-model="income.name" dense borderless class="income-name" placeholder="Название прихода"
                @click.stop />

            <MoneyInput v-if="showAmount" v-model="income.amount" class="income-amount" dense outlined
                @click.stop />

            <div v-if="showTotals" class="income-chips">
                <span class="chip chip--muted">Распределено {{ formatMoney(totals.allocated) }}</span>
                <span class="chip" :class="totals.free < 0 ? 'chip--negative' : 'chip--positive'">
                    Свободно {{ formatMoney(totals.free) }}
                </span>
            </div>

            <q-btn flat round dense size="sm" icon="sym_o_more_horiz" class="income-menu" @click.stop>
                <q-menu>
                    <q-list dense style="min-width: 190px">
                        <q-item clickable v-close-popup @click="confirmRemove">
                            <q-item-section>Удалить приход</q-item-section>
                        </q-item>
                    </q-list>
                </q-menu>
            </q-btn>
        </div>

        <div v-show="expanded" class="income-body">
            <div v-if="totals.orphaned" class="orphan-warning">
                Суммы по удалённым статьям: {{ formatMoney(totals.orphaned) }}
            </div>

            <BudgetCategoryRows :categories="period.categories" :accounts="accounts"
                :ensure-account="ensureAccount" :income="income" :has-allocations="hasAllocations" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import MoneyInput from 'src/components/MoneyInput/index.vue';
import BudgetCategoryRows from './BudgetCategoryRows.vue';
import { calcIncomeTotals, hasLeafAllocations } from 'src/domain/budget/calc';
import { formatMoney } from 'src/domain/budget/format';
import type { BudgetIncome, BudgetPeriodData, BudgetSavingsAccount } from 'src/domain/budget/types';

const props = withDefaults(defineProps<{
    income: BudgetIncome,
    period: BudgetPeriodData,
    accounts: BudgetSavingsAccount[],
    ensureAccount: (name: string) => string,
    showAmount?: boolean,
    showTotals?: boolean,
}>(), {
    showAmount: true,
    showTotals: true,
})

const emit = defineEmits<{
    remove: [income: BudgetIncome],
}>()

const $q = useQuasar()
const expanded = ref(true)

const totals = computed(() => calcIncomeTotals(props.period, props.income))
const hasAllocations = (leafId: string) => hasLeafAllocations(props.period, leafId)

const confirmRemove = () => {
    const hasValues = Object.values(props.income.allocations || {}).some(value => !!value)
    const remove = () => emit('remove', props.income)

    if (!hasValues) {
        remove()
        return
    }

    $q.dialog({
        title: 'Удалить приход?',
        message: `«${props.income.name || 'Приход'}» со всеми распределениями будет удалён.`,
        cancel: { label: 'Отмена', flat: true },
        ok: { label: 'Удалить', color: 'negative', flat: true },
        persistent: true,
    }).onOk(remove)
}
</script>

<style lang="scss" scoped>
.income {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fff;
    overflow: hidden;
}

.income--collapsed {
    background: #fafafa;
}

.income-head {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    cursor: pointer;
}

.income-head:hover {
    background: rgba(6, 95, 70, 0.04);
}

.income-toggle {
    color: #6b7280;
}

.income-name {
    flex: 1 1 auto;
    min-width: 90px;
    font-size: 13px;
    font-weight: 600;
}

.income-name :deep(.q-field__control) {
    height: 30px;
    min-height: 30px;
}

.income-name :deep(input) {
    font-size: 13px;
}

.income-amount {
    flex: 0 0 128px;
    width: 128px;
}

.income-amount :deep(.q-field__control) {
    height: 30px;
    min-height: 30px;
}

.income-amount :deep(.q-field__marginal) {
    height: 30px;
}

.income-amount :deep(input) {
    font-size: 12.5px;
}

.income-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: flex-end;
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

.income-menu {
    color: #6b7280;
}

.income-body {
    padding: 2px 12px 8px;
}

.orphan-warning {
    margin: 4px 0 6px;
    padding: 4px 8px;
    border-radius: 6px;
    background: #fffbeb;
    color: #92400e;
    font-size: 11px;
}

@media (max-width: 599px) {
    .income-head {
        flex-wrap: wrap;
    }

    .income-name {
        flex: 1 1 120px;
    }

    .income-amount {
        flex: 1 1 110px;
        width: auto;
    }

    .income-chips {
        order: 5;
        width: 100%;
        justify-content: flex-start;
    }
}
</style>
