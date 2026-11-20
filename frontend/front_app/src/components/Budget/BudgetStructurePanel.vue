<template>
    <div class="structure-panel">
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
            <q-card-section class="structure-card__title structure-title-row">
                <span class="col">Сберегательные счета</span>
                <q-btn flat dense no-caps color="primary" icon="sym_o_add" label="Счёт"
                    @click="addAccount" />
            </q-card-section>
            <q-separator />
            <q-card-section class="accounts-section">
                <div v-if="!accounts.length" class="structure-hint">
                    Счетов пока нет. Создайте счёт и привяжите к статье через меню статьи.
                </div>

                <template v-if="accounts.length">
                    <div class="account-row account-row--head">
                        <span />
                        <span>Счёт</span>
                        <span>Начальный остаток</span>
                        <span>Сейчас</span>
                        <span />
                    </div>

                    <template v-for="account in accounts" :key="account.id">
                        <div class="account-row">
                            <q-btn flat round dense size="sm" class="account-expand"
                                :icon="expandedAccountId === account.id ? 'sym_o_expand_less' : 'sym_o_expand_more'"
                                @click="toggleAccount(account.id)">
                                <q-tooltip>Пополнения по периодам</q-tooltip>
                            </q-btn>
                            <q-input v-model="account.name" dense borderless class="account-name"
                                placeholder="Название счёта" />
                            <div class="account-field">
                                <span class="account-label">начальный остаток</span>
                                <MoneyInput v-model="account.initialBalance" dense outlined
                                    class="account-money budget-field" />
                            </div>
                            <div class="account-field account-field--balance">
                                <span class="account-label">сейчас</span>
                                <span class="account-balance">{{ formatMoney(balanceOf(account.id)) }}</span>
                            </div>
                            <q-btn flat round dense size="sm" icon="sym_o_delete" class="account-delete"
                                @click="removeAccount(account)">
                                <q-tooltip>Удалить счёт</q-tooltip>
                            </q-btn>
                        </div>

                        <div v-if="expandedAccountId === account.id" class="account-history">
                            <BudgetSavingsDeltaRow v-for="period in periods" :key="`${account.id}:${period._id}`"
                                :period-id="period._id" :periods="periods" :account="account"
                                @changed="emit('changed')" />
                        </div>
                    </template>
                </template>
            </q-card-section>
        </q-card>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import MoneyInput from 'src/components/MoneyInput/index.vue';
import BudgetCategoryRows from './BudgetCategoryRows.vue';
import BudgetSavingsDeltaRow from './BudgetSavingsDeltaRow.vue';
import { useBudgetTemplateRef } from 'src/services/database/wrappers/budget';
import { calcAllSavingsBalances, isSavingsAccountUsed, listLeaves } from 'src/domain/budget/calc';
import { formatMoney } from 'src/domain/budget/format';
import type { BudgetSavingsAccount } from 'src/domain/budget/types';
import type { BudgetPeriodDBData } from 'src/models/database';

const props = defineProps<{
    periods: BudgetPeriodDBData[],
    accounts: BudgetSavingsAccount[],
    ensureAccount: (name: string) => string,
    removeAccount: (accountId: string) => void,
}>()

const emit = defineEmits<{ changed: [] }>()

const $q = useQuasar()
const templateRef = useBudgetTemplateRef()

const templateReady = ref(false)
const expandedAccountId = ref('')

const templateCategories = computed(() => templateRef.value.categories ?? [])
const noAllocations = () => false

const balances = computed(() => calcAllSavingsBalances(props.periods, props.accounts))
const balanceOf = (accountId: string) => balances.value[accountId]?.balance ?? 0

onMounted(async () => {
    try {
        await templateRef.initFromDB()
        templateReady.value = true
    } catch (error) {
        console.error('Не удалось загрузить шаблон статей:', error)
        $q.notify({ type: 'negative', message: 'Не удалось загрузить шаблон статей' })
    }
})

const toggleAccount = (accountId: string) => {
    expandedAccountId.value = expandedAccountId.value === accountId ? '' : accountId
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
    }).onOk((name: string) => { props.ensureAccount(String(name).trim()) })
}

const removeAccount = (account: BudgetSavingsAccount) => {
    if (isSavingsAccountUsed(props.periods, account.id) || isAccountLinked(account.id)) {
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
    }).onOk(() => props.removeAccount(account.id))
}

const isAccountLinked = (accountId: string): boolean => {
    const inPeriods = props.periods.some(period => listLeaves(period.categories)
        .some(leaf => leaf.savingsAccountId === accountId))
    if (inPeriods) return true
    return listLeaves(templateCategories.value)
        .some(leaf => leaf.savingsAccountId === accountId)
}
</script>

<style lang="scss" scoped>
.structure-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
}

.structure-card {
    width: 100%;
    border-radius: 10px;
}

.structure-card__title {
    padding: 10px 14px;
    color: #374151;
    font-size: 13px;
    font-weight: 600;
}

.structure-title-row {
    display: flex;
    align-items: center;
}

.structure-hint {
    margin-bottom: 8px;
    color: #6b7280;
    font-size: 12px;
    line-height: 1.45;
}

.accounts-section {
    padding-top: 6px;
}

.account-row {
    display: grid;
    grid-template-columns: 28px 260px 170px 120px 32px;
    gap: 14px;
    align-items: center;
    justify-content: start;
    padding: 5px 0;
    border-bottom: 1px solid #f1f5f9;
}

.account-row--head {
    min-height: 24px;
    padding-bottom: 2px;
    color: #9ca3af;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.account-row--head span:nth-child(3),
.account-row--head span:nth-child(4) {
    text-align: right;
}

.account-expand {
    color: #6b7280;
}

.account-name {
    font-size: 13px;
}

.account-balance {
    color: #111827;
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    text-align: right;
}

.account-money {
    width: 100%;
}

.account-field {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
}

.account-label {
    display: none;
    color: #9ca3af;
    font-size: 10px;
}

.account-delete {
    color: #b91c1c;
}

.account-history {
    margin-bottom: 4px;
}

@media (max-width: 767px) {
    .account-row {
        grid-template-columns: 28px minmax(0, 1fr) 28px;
        justify-content: stretch;
        row-gap: 4px;
    }

    .account-row--head {
        display: none;
    }

    .account-name {
        grid-column: 2 / 3;
        grid-row: 1;
    }

    .account-field {
        grid-column: 2 / 4;
    }

    .account-label {
        display: block;
    }

    .account-balance {
        text-align: left;
    }

    .account-delete {
        grid-column: 3 / 4;
        grid-row: 1;
    }
}
</style>
