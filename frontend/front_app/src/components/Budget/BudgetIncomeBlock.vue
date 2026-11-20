<template>
    <div class="income" :class="{ 'income--collapsed': !expanded }">
        <div class="income-head" @click="expanded = !expanded">
            <q-btn flat round dense size="sm" class="income-toggle"
                :icon="expanded ? 'sym_o_expand_less' : 'sym_o_expand_more'"
                :aria-label="expanded ? 'Свернуть приход' : 'Раскрыть приход'" @click.stop="expanded = !expanded" />

            <q-input v-model="income.name" dense borderless class="income-name" placeholder="Название прихода"
                @click.stop />

            <MoneyInput v-model="income.amount" class="income-amount" dense outlined @click.stop />

            <div class="income-chips">
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

            <div v-for="category in period.categories" :key="category.id" class="category">
                <template v-if="category.children.length">
                    <div class="category-head">
                        <div class="category-name">{{ category.name }}</div>
                        <div class="category-total">{{ formatMoney(categoryTotal(category.id)) }}</div>
                    </div>
                    <div v-for="child in category.children" :key="child.id" class="leaf-row leaf-row--sub">
                        <div class="leaf-name">
                            <span>{{ child.name }}</span>
                            <q-icon v-if="child.savingsAccountId" name="sym_o_savings" size="15px"
                                class="leaf-savings" />
                        </div>
                        <MoneyInput :model-value="amountOf(child.id)" dense outlined class="leaf-input"
                            @update:model-value="value => setAmount(child.id, value)" />
                    </div>
                </template>

                <div v-else class="leaf-row leaf-row--category">
                    <div class="leaf-name">
                        <span>{{ category.name }}</span>
                        <q-icon v-if="category.savingsAccountId" name="sym_o_savings" size="15px"
                            class="leaf-savings" />
                    </div>
                    <MoneyInput :model-value="amountOf(category.id)" dense outlined class="leaf-input"
                        @update:model-value="value => setAmount(category.id, value)" />
                </div>
            </div>

            <div v-if="!period.categories.length" class="income-empty">
                В периоде пока нет статей. Добавьте их через «Настроить статьи».
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import MoneyInput from 'src/components/MoneyInput/index.vue';
import { calcIncomeTotals, listLeaves } from 'src/domain/budget/calc';
import { formatMoney } from 'src/domain/budget/format';
import type { BudgetIncome, BudgetPeriodData } from 'src/domain/budget/types';

const props = defineProps<{
    income: BudgetIncome,
    period: BudgetPeriodData,
}>()

const emit = defineEmits<{
    remove: [income: BudgetIncome],
}>()

const $q = useQuasar()
const expanded = ref(true)

const totals = computed(() => calcIncomeTotals(props.period, props.income))

const leaves = computed(() => listLeaves(props.period.categories))

const amountOf = (leafId: string) => props.income.allocations?.[leafId] ?? 0

const setAmount = (leafId: string, value: number) => {
    if (!props.income.allocations) props.income.allocations = {}
    if (value) props.income.allocations[leafId] = value
    else delete props.income.allocations[leafId]
}

const categoryTotal = (categoryId: string) => {
    return leaves.value
        .filter(leaf => leaf.categoryId === categoryId)
        .reduce((sum, leaf) => sum + amountOf(leaf.id), 0)
}

const confirmRemove = () => {
    const hasAllocations = Object.values(props.income.allocations || {}).some(value => !!value)
    const remove = () => emit('remove', props.income)

    if (!hasAllocations) {
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
    padding: 6px 8px;
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
    font-size: 14px;
    font-weight: 600;
}

.income-amount {
    flex: 0 0 130px;
    width: 130px;
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
    padding: 4px 12px 10px;
}

.category + .category {
    margin-top: 2px;
}

.category-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 130px;
    gap: 10px;
    padding: 6px 0 2px;
    font-size: 12px;
    font-weight: 600;
    color: #374151;
}

.category-total {
    text-align: right;
    font-variant-numeric: tabular-nums;
}

.leaf-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 130px;
    gap: 10px;
    align-items: center;
    padding: 2px 0;
}

.leaf-row--sub .leaf-name {
    padding-left: 14px;
    color: #4b5563;
    font-size: 13px;
}

.leaf-row--category .leaf-name {
    font-size: 13px;
    color: #1f2937;
}

.leaf-name {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
}

.leaf-name span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.leaf-savings {
    color: #0f766e;
    flex: 0 0 auto;
}

.orphan-warning {
    margin: 4px 0 6px;
    padding: 4px 8px;
    border-radius: 6px;
    background: #fffbeb;
    color: #92400e;
    font-size: 11px;
}

.income-empty {
    padding: 8px 0;
    color: #6b7280;
    font-size: 12px;
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

    .leaf-row,
    .category-head {
        grid-template-columns: minmax(0, 1fr) 104px;
        gap: 8px;
    }
}
</style>
