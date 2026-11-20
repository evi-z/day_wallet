<template>
    <q-page class="structure-page">
        <InnerLoading :showing="loading" />

        <div class="structure-head">
            <q-btn flat round dense icon="sym_o_arrow_back" class="structure-back"
                @click="$router.push({ name: PAGES.Plan })">
                <q-tooltip>К бюджету</q-tooltip>
            </q-btn>
            <div>
                <div class="structure-title">Структура бюджета</div>
                <div class="structure-subtitle">Шаблон статей и сберегательные счета</div>
            </div>
        </div>

        <q-card flat bordered class="structure-card">
            <q-card-section class="structure-card__title">Шаблон статей</q-card-section>
            <q-separator />
            <q-card-section>
                <div class="structure-hint">
                    Новые периоды начинаются с этого набора. Правки здесь не меняют уже созданные
                    периоды: их статьи редактируются прямо в приходе.
                </div>
                <BudgetCategoryRows v-if="templateReady" :categories="templateCategories"
                    :accounts="accounts" :ensure-account="ensureAccount" :has-allocations="noAllocations" />
            </q-card-section>
        </q-card>

        <q-card flat bordered class="structure-card">
            <q-card-section class="structure-card__title row items-center">
                <span class="col">Сберегательные счета</span>
                <q-btn flat dense no-caps color="primary" icon="sym_o_add" label="Счёт"
                    @click="addAccount" />
            </q-card-section>
            <q-separator />
            <q-card-section>
                <div v-if="!accounts.length" class="structure-hint">
                    Счетов пока нет. Создайте счёт здесь или из карточки периода.
                </div>

                <div v-for="account in accounts" :key="account.id" class="account-row">
                    <q-input v-model="account.name" dense borderless class="account-name"
                        placeholder="Название счёта" />
                    <div class="account-field">
                        <span class="account-label">начальный остаток</span>
                        <MoneyInput v-model="account.initialBalance" dense outlined class="account-money" />
                    </div>
                    <div class="account-field">
                        <span class="account-label">сейчас</span>
                        <span class="account-balance">{{ formatMoney(balanceOf(account.id)) }}</span>
                    </div>
                    <q-btn flat round dense size="sm" icon="sym_o_delete" class="account-delete"
                        @click="removeAccount(account)">
                        <q-tooltip>Удалить счёт</q-tooltip>
                    </q-btn>
                </div>
            </q-card-section>
        </q-card>
    </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import InnerLoading from 'src/components/InnerLoading/index.vue';
import MoneyInput from 'src/components/MoneyInput/index.vue';
import BudgetCategoryRows from 'src/components/Budget/BudgetCategoryRows.vue';
import app from 'src/services/app';
import { useBudgetSettingsRef, useBudgetTemplateRef } from 'src/services/database/wrappers/budget';
import { calcAllSavingsBalances, isSavingsAccountUsed, listLeaves } from 'src/domain/budget/calc';
import { formatMoney } from 'src/domain/budget/format';
import { createBudgetId } from 'src/domain/budget/defaults';
import type { BudgetSavingsAccount } from 'src/domain/budget/types';
import type { BudgetPeriodDBData } from 'src/models/database';
import { PAGES } from 'src/router/models';

const $q = useQuasar()
const settingsRef = useBudgetSettingsRef()
const templateRef = useBudgetTemplateRef()

const loading = ref(true)
const templateReady = ref(false)
const periods = ref<BudgetPeriodDBData[]>([])

const accounts = computed(() => settingsRef.value.savingsAccounts ?? [])
const templateCategories = computed(() => templateRef.value.categories ?? [])

const balances = computed(() => calcAllSavingsBalances(periods.value, accounts.value))
const balanceOf = (accountId: string) => balances.value[accountId]?.balance ?? 0

const noAllocations = () => false

onMounted(async () => {
    try {
        await settingsRef.initFromDB()
        if (!settingsRef.value.savingsAccounts) settingsRef.value.savingsAccounts = []
        await templateRef.initFromDB()
        templateReady.value = true
        periods.value = await app.userDb!.fetchBudgetPeriods()
    } catch (error) {
        console.error('Не удалось загрузить структуру бюджета:', error)
        $q.notify({ type: 'negative', message: 'Не удалось загрузить структуру бюджета' })
    } finally {
        loading.value = false
    }
})

const ensureAccount = (name: string): string => {
    const list = settingsRef.value.savingsAccounts || (settingsRef.value.savingsAccounts = [])
    const existing = list.find(account => account.name.toLowerCase() === name.toLowerCase())
    if (existing) return existing.id

    const account = {
        id: createBudgetId(),
        name,
        initialBalance: 0,
        createdAt: new Date().toISOString(),
    }
    list.push(account)
    return account.id
}

const addAccount = () => {
    $q.dialog({
        title: 'Новый сберегательный счёт',
        prompt: {
            model: '',
            type: 'text',
            isValid: value => !!String(value).trim(),
        },
        cancel: { label: 'Отмена', flat: true },
        ok: { label: 'Создать', color: 'primary', flat: true },
        persistent: true,
    }).onOk((name: string) => { ensureAccount(String(name).trim()) })
}

const removeAccount = (account: BudgetSavingsAccount) => {
    if (isSavingsAccountUsed(periods.value, account.id) || isAccountLinked(account.id)) {
        $q.notify({
            type: 'warning',
            message: 'Счёт используется в периодах или шаблоне. Сначала отвяжите его от статей.',
        })
        return
    }

    $q.dialog({
        title: 'Удалить сберегательный счёт?',
        message: `«${account.name}» будет удалён.`,
        cancel: { label: 'Отмена', flat: true },
        ok: { label: 'Удалить', color: 'negative', flat: true },
        persistent: true,
    }).onOk(() => {
        const list = settingsRef.value.savingsAccounts || []
        settingsRef.value.savingsAccounts = list.filter(item => item.id !== account.id)
    })
}

const isAccountLinked = (accountId: string): boolean => {
    const inPeriods = periods.value.some(period => listLeaves(period.categories)
        .some(leaf => leaf.savingsAccountId === accountId))
    if (inPeriods) return true
    return listLeaves(templateRef.value.categories || [])
        .some(leaf => leaf.savingsAccountId === accountId)
}
</script>

<style lang="scss" scoped>
.structure-page {
    padding: 10px 20px 24px;
    width: 100%;
}

.structure-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
}

.structure-back {
    color: #4b5563;
}

.structure-title {
    color: #111827;
    font-size: 18px;
    font-weight: 600;
}

.structure-subtitle {
    color: #6b7280;
    font-size: 12px;
}

.structure-card {
    max-width: 1000px;
    margin-bottom: 14px;
    border-radius: 10px;
}

.structure-card__title {
    padding: 12px 16px;
    color: #374151;
    font-size: 13px;
    font-weight: 600;
}

.structure-hint {
    margin-bottom: 10px;
    color: #6b7280;
    font-size: 12px;
    line-height: 1.45;
}

.account-row {
    display: grid;
    grid-template-columns: minmax(160px, 1.2fr) 170px minmax(110px, 0.8fr) 32px;
    gap: 12px;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px solid #f1f5f9;
}

.account-name {
    font-size: 13px;
}

.account-field {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.account-label {
    color: #9ca3af;
    font-size: 10px;
}

.account-money :deep(.q-field__control) {
    height: 30px;
    min-height: 30px;
}

.account-money :deep(.q-field__marginal) {
    height: 30px;
}

.account-money :deep(input) {
    font-size: 12.5px;
}

.account-balance {
    color: #111827;
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.account-delete {
    color: #b91c1c;
}

@media (max-width: 767px) {
    .structure-page {
        padding: 8px 10px 18px;
    }

    .account-row {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        row-gap: 6px;
    }

    .account-name {
        grid-column: 1 / -1;
    }
}
</style>
