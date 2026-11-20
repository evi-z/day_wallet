<template>
    <div class="rows">
        <div v-for="category in categories" :key="category.id" class="group">
            <div class="cat-row cat-row--category">
                <div class="cat-name-wrap">
                    <q-input v-model="category.name" dense borderless class="cat-name" placeholder="Статья" />
                    <q-icon v-if="category.savingsAccountId" name="sym_o_savings" size="14px" class="cat-savings" />
                </div>

                <MoneyInput v-if="income && !category.children.length" :model-value="amountOf(category.id)"
                    dense outlined class="cat-amount"
                    @update:model-value="value => setAmount(category.id, value)" />
                <div v-else-if="income" class="cat-total">{{ formatMoney(categoryTotal(category.id)) }}</div>

                <q-btn flat round dense size="sm" icon="sym_o_more_horiz" class="cat-menu">
                    <q-menu>
                        <q-list dense style="min-width: 220px">
                            <q-item v-if="!category.children.length" clickable v-close-popup
                                @click="addChild(category)">
                                <q-item-section>Добавить подстатью</q-item-section>
                            </q-item>
                            <template v-if="!category.children.length">
                                <q-separator />
                                <q-item clickable v-close-popup @click="setSavings(category, undefined)">
                                    <q-item-section avatar>
                                        <q-icon :name="category.savingsAccountId ? '' : 'sym_o_check'" size="16px" />
                                    </q-item-section>
                                    <q-item-section>Без счёта</q-item-section>
                                </q-item>
                                <q-item v-for="account in accounts" :key="account.id" clickable v-close-popup
                                    @click="setSavings(category, account.id)">
                                    <q-item-section avatar>
                                        <q-icon :name="category.savingsAccountId === account.id ? 'sym_o_check' : ''"
                                            size="16px" />
                                    </q-item-section>
                                    <q-item-section>{{ account.name }}</q-item-section>
                                </q-item>
                                <q-item clickable v-close-popup @click="createAccount(category)">
                                    <q-item-section>Новый счёт…</q-item-section>
                                </q-item>
                            </template>
                            <q-separator />
                            <q-item clickable v-close-popup @click="removeCategory(category)">
                                <q-item-section class="text-negative">Удалить статью</q-item-section>
                            </q-item>
                        </q-list>
                    </q-menu>
                </q-btn>
            </div>

            <div v-for="child in category.children" :key="child.id" class="cat-row cat-row--sub">
                <div class="cat-name-wrap">
                    <q-input v-model="child.name" dense borderless class="cat-name" placeholder="Подстатья" />
                    <q-icon v-if="child.savingsAccountId" name="sym_o_savings" size="14px" class="cat-savings" />
                </div>

                <MoneyInput v-if="income" :model-value="amountOf(child.id)" dense outlined class="cat-amount"
                    @update:model-value="value => setAmount(child.id, value)" />

                <q-btn flat round dense size="sm" icon="sym_o_more_horiz" class="cat-menu">
                    <q-menu>
                        <q-list dense style="min-width: 220px">
                            <q-item clickable v-close-popup @click="setSavings(child, undefined)">
                                <q-item-section avatar>
                                    <q-icon :name="child.savingsAccountId ? '' : 'sym_o_check'" size="16px" />
                                </q-item-section>
                                <q-item-section>Без счёта</q-item-section>
                            </q-item>
                            <q-item v-for="account in accounts" :key="account.id" clickable v-close-popup
                                @click="setSavings(child, account.id)">
                                <q-item-section avatar>
                                    <q-icon :name="child.savingsAccountId === account.id ? 'sym_o_check' : ''"
                                        size="16px" />
                                </q-item-section>
                                <q-item-section>{{ account.name }}</q-item-section>
                            </q-item>
                            <q-item clickable v-close-popup @click="createAccount(child)">
                                <q-item-section>Новый счёт…</q-item-section>
                            </q-item>
                            <q-separator />
                            <q-item clickable v-close-popup @click="removeChild(category, child)">
                                <q-item-section class="text-negative">Удалить подстатью</q-item-section>
                            </q-item>
                        </q-list>
                    </q-menu>
                </q-btn>
            </div>
        </div>

        <q-btn flat dense no-caps color="primary" icon="sym_o_add" label="Добавить статью"
            class="rows-add" @click="addCategory" />
    </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import MoneyInput from 'src/components/MoneyInput/index.vue';
import { listLeaves } from 'src/domain/budget/calc';
import { formatMoney } from 'src/domain/budget/format';
import { createBudgetId } from 'src/domain/budget/defaults';
import type {
    BudgetCategory,
    BudgetIncome,
    BudgetSavingsAccount,
    BudgetSubcategory,
} from 'src/domain/budget/types';

const props = defineProps<{
    categories: BudgetCategory[],
    accounts: BudgetSavingsAccount[],
    ensureAccount: (name: string) => string,
    income?: BudgetIncome,
    hasAllocations: (leafId: string) => boolean,
}>()

const $q = useQuasar()

const amountOf = (leafId: string) => props.income?.allocations?.[leafId] ?? 0

const setAmount = (leafId: string, value: number) => {
    if (!props.income) return
    if (!props.income.allocations) props.income.allocations = {}
    if (value) props.income.allocations[leafId] = value
    else delete props.income.allocations[leafId]
}

const categoryTotal = (categoryId: string) => {
    if (!props.income) return 0
    return listLeaves(props.categories)
        .filter(leaf => leaf.categoryId === categoryId)
        .reduce((sum, leaf) => sum + amountOf(leaf.id), 0)
}

const addCategory = () => {
    props.categories.push({ id: createBudgetId(), name: '', children: [] })
}

const addChild = (category: BudgetCategory) => {
    if (props.hasAllocations(category.id)) {
        $q.notify({
            type: 'warning',
            message: 'По статье уже есть распределения. Сначала обнулите их.',
        })
        return
    }
    category.savingsAccountId = undefined
    category.children.push({ id: createBudgetId(), name: '' })
}

const removeCategory = (category: BudgetCategory) => {
    const leafBlocked = !category.children.length && props.hasAllocations(category.id)
    const childBlocked = category.children.some(child => props.hasAllocations(child.id))
    if (leafBlocked || childBlocked) {
        $q.notify({ type: 'warning', message: 'По статье есть распределения. Сначала обнулите их.' })
        return
    }
    const index = props.categories.findIndex(item => item.id === category.id)
    if (index !== -1) props.categories.splice(index, 1)
}

const removeChild = (category: BudgetCategory, child: BudgetSubcategory) => {
    if (props.hasAllocations(child.id)) {
        $q.notify({ type: 'warning', message: 'По подстатье есть распределения. Сначала обнулите их.' })
        return
    }
    const index = category.children.findIndex(item => item.id === child.id)
    if (index !== -1) category.children.splice(index, 1)
}

const setSavings = (
    node: BudgetCategory | BudgetSubcategory,
    accountId: string | undefined,
) => {
    node.savingsAccountId = accountId
}

const createAccount = (node: BudgetCategory | BudgetSubcategory) => {
    $q.dialog({
        title: 'Новый сберегательный счёт',
        prompt: {
            model: node.name || '',
            type: 'text',
            isValid: value => !!String(value).trim(),
        },
        cancel: { label: 'Отмена', flat: true },
        ok: { label: 'Создать', color: 'primary', flat: true },
        persistent: true,
    }).onOk((name: string) => {
        node.savingsAccountId = props.ensureAccount(String(name).trim())
    })
}
</script>

<style lang="scss" scoped>
.rows {
    display: flex;
    flex-direction: column;
}

.cat-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 128px 28px;
    gap: 8px;
    align-items: center;
    min-height: 32px;
}

.cat-row--sub {
    padding-left: 16px;
}

.cat-name {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 13px;
    color: #1f2937;
}

.cat-name-wrap {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
}

.cat-savings {
    flex: 0 0 auto;
    color: #0f766e;
}

.cat-name :deep(.q-field__control) {
    height: 28px;
    min-height: 28px;
}

.cat-name :deep(input) {
    font-size: 12.5px;
}

.cat-row--sub .cat-name :deep(input) {
    color: #4b5563;
    font-size: 12.5px;
}

.cat-amount :deep(.q-field__control) {
    height: 30px;
    min-height: 30px;
}

.cat-amount {
    width: 100%;
}

.cat-amount :deep(.q-field__inner),
.cat-amount :deep(.q-field__control) {
    width: 100%;
}

.cat-amount :deep(.q-field__marginal) {
    height: 30px;
}

.cat-amount :deep(input) {
    font-size: 12.5px;
}

.cat-total {
    padding-right: 6px;
    color: #374151;
    font-size: 12.5px;
    font-variant-numeric: tabular-nums;
    text-align: right;
}

.cat-menu {
    color: #9ca3af;
}

.rows-add {
    align-self: flex-start;
    margin-top: 2px;
}

@media (max-width: 599px) {
    .cat-row {
        grid-template-columns: minmax(0, 1fr) 104px 24px;
        gap: 6px;
    }
}
</style>
