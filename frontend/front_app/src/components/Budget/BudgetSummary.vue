<template>
    <div class="summary">
        <div v-if="!periods.length" class="summary-empty">
            Сводка появится, когда будет хотя бы один период.
        </div>

        <template v-else>
            <div class="summary-scroll">
                <table class="summary-table">
                    <thead>
                        <tr>
                            <th class="col-name">Статья</th>
                            <th v-for="(label, index) in summary.periodLabels" :key="index">{{ label }}</th>
                            <th>Итого</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="category in summary.categories" :key="category.id">
                            <tr class="row-category">
                                <td class="col-name">
                                    <q-icon v-if="category.isSavings" name="sym_o_savings" size="14px" class="mark" />
                                    {{ category.name }}
                                </td>
                                <td v-for="periodId in summary.periodIds" :key="periodId"
                                    :class="cellClass(category.byPeriod[periodId])">
                                    {{ cell(category.byPeriod[periodId]) }}
                                </td>
                                <td class="col-total">{{ formatMoney(category.total) }}</td>
                            </tr>
                            <tr v-for="child in category.children" :key="child.id" class="row-sub">
                                <td class="col-name">
                                    <q-icon v-if="child.isSavings" name="sym_o_savings" size="13px" class="mark" />
                                    {{ child.name }}
                                </td>
                                <td v-for="periodId in summary.periodIds" :key="periodId"
                                    :class="cellClass(child.byPeriod[periodId])">
                                    {{ cell(child.byPeriod[periodId]) }}
                                </td>
                                <td class="col-total">{{ formatMoney(child.total) }}</td>
                            </tr>
                        </template>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td class="col-name">Доход</td>
                            <td v-for="periodId in summary.periodIds" :key="periodId">
                                {{ formatMoney(summary.incomeByPeriod[periodId] ?? 0) }}
                            </td>
                            <td class="col-total">
                                {{ formatMoney(sum(summary.incomeByPeriod)) }}
                            </td>
                        </tr>
                        <tr>
                            <td class="col-name">Распределено</td>
                            <td v-for="periodId in summary.periodIds" :key="periodId">
                                {{ formatMoney(summary.allocatedByPeriod[periodId] ?? 0) }}
                            </td>
                            <td class="col-total">{{ formatMoney(sum(summary.allocatedByPeriod)) }}</td>
                        </tr>
                        <tr class="row-free">
                            <td class="col-name">Свободно</td>
                            <td v-for="periodId in summary.periodIds" :key="periodId"
                                :class="(summary.freeByPeriod[periodId] ?? 0) < 0 ? 'negative' : ''">
                                {{ formatMoney(summary.freeByPeriod[periodId] ?? 0) }}
                            </td>
                            <td class="col-total">{{ formatMoney(sum(summary.freeByPeriod)) }}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div v-if="accounts.length" class="savings-block">
                <div class="savings-title">Сбережения</div>
                <div class="summary-scroll">
                    <table class="summary-table">
                        <thead>
                            <tr>
                                <th class="col-name">Счёт</th>
                                <th v-for="(label, index) in summary.periodLabels" :key="index">{{ label }}</th>
                                <th>Остаток</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in summary.savings" :key="row.accountId">
                                <td class="col-name">
                                    <q-icon name="sym_o_savings" size="14px" class="mark" />
                                    {{ row.name }}
                                </td>
                                <td v-for="periodId in summary.periodIds" :key="periodId"
                                    :class="cellClass(row.byPeriod[periodId])">
                                    {{ cell(row.byPeriod[periodId]) }}
                                </td>
                                <td class="col-total">{{ formatMoney(row.balance) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatMoney } from 'src/domain/budget/format';
import { calcBudgetSummary } from 'src/domain/budget/summary';
import type { BudgetSavingsAccount } from 'src/domain/budget/types';
import type { BudgetPeriodDBData } from 'src/models/database';

const props = defineProps<{
    periods: BudgetPeriodDBData[],
    accounts: BudgetSavingsAccount[],
}>()

const summary = computed(() => calcBudgetSummary(
    props.periods.map(period => ({ ...period, _id: period._id })),
    props.accounts,
))

const cell = (value: number | undefined) => (value ? formatMoney(value) : '—')
const cellClass = (value: number | undefined) => (value ? 'has-value' : 'is-empty')
const sum = (map: Record<string, number>) => Object.values(map).reduce((acc, value) => acc + value, 0)
</script>

<style lang="scss" scoped>
.summary {
    width: 100%;
}

.summary-empty {
    padding: 32px 16px;
    border: 1px dashed #d1d5db;
    border-radius: 12px;
    color: #6b7280;
    text-align: center;
}

.summary-scroll {
    overflow-x: auto;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fff;
}

.summary-table {
    width: 100%;
    min-width: 640px;
    border-collapse: collapse;
    font-size: 12.5px;
}

.summary-table th,
.summary-table td {
    padding: 7px 12px;
    border-bottom: 1px solid #f1f5f9;
    text-align: right;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
}

.summary-table th {
    color: #6b7280;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    background: #fafafa;
}

.summary-table .col-name {
    position: sticky;
    left: 0;
    z-index: 1;
    min-width: 180px;
    text-align: left;
    color: #1f2937;
    background: inherit;
}

.summary-table td.col-name {
    background: #fff;
}

.summary-table th.col-name {
    background: #fafafa;
}

.row-category td {
    font-weight: 600;
}

.row-sub td.col-name {
    padding-left: 30px;
    color: #4b5563;
    font-weight: 400;
}

.row-sub td {
    color: #4b5563;
}

.col-total {
    font-weight: 600;
}

.is-empty {
    color: #c0c6cf;
}

.negative {
    color: #b91c1c;
}

.mark {
    margin-right: 4px;
    color: #0f766e;
    vertical-align: -2px;
}

.summary-table tfoot td {
    border-top: 1px solid #e5e7eb;
    border-bottom: none;
    background: #fafafa;
    font-weight: 600;
}

.savings-block {
    margin-top: 18px;
}

.savings-title {
    margin-bottom: 8px;
    color: #374151;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

@media (max-width: 599px) {
    .summary-table .col-name {
        min-width: 140px;
    }

    .summary-table th,
    .summary-table td {
        padding: 6px 8px;
    }
}
</style>
