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
            <q-card-section class="structure-card__title row items-center">
                <span class="col">Сберегательные счета</span>
                <q-btn flat dense no-caps color="primary" icon="sym_o_add" label="Счёт"
                    @click="addAccount" />
            </q-card-section>
            <q-separator />
            <q-card-section>
                <div v-if="!accounts.length" class="structure-hint">
                    Счетов пока нет. Создайте счёт и привяжите к статье через меню статьи.
                </div>

                <div v-for="account in accounts" :key="account.id" class="account-row">
                    <q-input v-model="account.name" dense borderless class="account-name"
                        placeholder="Название счёта" />
                    <div class="account-field">
                        <span class="account-label">начальный остаток</span>
                        <MoneyInput v-model="account.initialBalance" dense outlined
                            class="account-money budget-field" />
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

        <q-card flat bordered class="structure-card">
            <q-card-section class="structure-card__title savings-title-row">
                <span>Пополнения сбережений</span>
                <q-select v-if="periods.length" v-model="selectedPeriodId" :options="periodOptions"
                    option-value="value" option-label="label" emit-value map-options dense outlined
                    class="period-select" />
            </q-card-section>
            <q-separator />
            <q-card-section>
                <div v-if="!periods.length" class="structure-hint">
                    Сначала создайте период на вкладке «Распределения».
                </div>
                <BudgetSavingsPeriodBlock v-else-if="selectedPeriodId" :key="selectedPeriodId"
                    :period-id="selectedPeriodId" :periods="periods" :accounts="accounts"
                    @changed="emit('changed')" />
            </q-card-section>
        </q-card>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import MoneyInput from 'src/components/MoneyInput/index.vue';
import BudgetCategoryRows from './BudgetCategoryRows.vue';
import BudgetSavingsPeriodBlock from './BudgetSavingsPeriodBlock.vue';
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
const selectedPeriodId = ref('')

const templateCategories = computed(() => templateRef.value.categories ?? [])
const noAllocations = () => false

const balances = computed(() => calcAllSavingsBalances(props.periods, props.accounts))
const balanceOf = (accountId: string) => balances.value[accountId]?.balance ?? 0

const periodOptions = computed(() => [...props.periods]
    .sort((a, b) => b.seq - a.seq)
    .map(period => ({ label: period.label, value: period._id })))

onMounted(async () => {
    try {
        await templateRef.initFromDB()
        templateReady.value = true
    } catch (error) {
        console.error('Не удалось загрузить шаблон статей:', error)
        $q.notify({ type: 'negative', message: 'Не удалось загрузить шаблон статей' })
    }
})

watch(() => props.periods, (periods) => {
    if (!periods.length) {
        selectedPeriodId.value = ''
        return
    }
    if (!selectedPeriodId.value || !periods.some(period => period._id === selectedPeriodId.value)) {
        selectedPeriodId.value = [...periods].sort((a, b) => b.seq - a.seq)[0]!._id
    }
}, { immediate: true, deep: false })

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

.structure-hint {
    margin-bottom: 8px;
    color: #6b7280;
    font-size: 12px;
    line-height: 1.45;
}

.account-row {
    display: grid;
    grid-template-columns: 220px 170px 110px 32px;
    gap: 16px;
    align-items: center;
    justify-content: start;
    padding: 5px 0;
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

.account-balance {
    color: #111827;
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.account-delete {
    color: #b91c1c;
}

.savings-title-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.period-select {
    min-width: 190px;
}

@media (max-width: 767px) {
    .account-row {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        justify-content: stretch;
        row-gap: 6px;
    }

    .account-name {
        grid-column: 1 / -1;
    }

    .period-select {
        min-width: 0;
        flex: 1 1 auto;
    }
}
</style>
