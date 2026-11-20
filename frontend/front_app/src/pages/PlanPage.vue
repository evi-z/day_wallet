<template>
    <q-page class="budget-page">
        <InnerLoading :showing="loading" />

        <div class="budget-head">
            <div class="budget-heading">
                <div class="budget-title">Бюджетирование</div>
                <div class="budget-subtitle">Приходы, статьи и сбережения по финансовым периодам</div>
            </div>
            <q-btn unelevated no-caps color="primary" icon="sym_o_add" label="Период" class="budget-add"
                @click="createOpen = true" />
        </div>

        <div v-if="!loading && !periods.length" class="budget-empty">
            <q-icon name="sym_o_trending_up" size="40px" />
            <div class="budget-empty__title">Пока нет ни одного периода</div>
            <div class="budget-empty__text">
                Создайте период, укажите приход и распределите его по статьям.
                Сберегательные счета можно добавить отдельно.
            </div>
            <q-btn unelevated no-caps color="primary" icon="sym_o_add" label="Создать период"
                @click="createOpen = true" />
        </div>

        <div class="budget-list">
            <BudgetPeriodCard v-for="doc in periods" :key="doc._id" :doc-id="doc._id" :periods="periods"
                :accounts="accounts" :ensure-account="ensureAccount" :remove-account="removeAccount"
                :set-account-initial="setAccountInitial" @delete="handleDelete" @changed="scheduleReload"
                @make-template="handleMakeTemplate" />
        </div>

        <BudgetPeriodDialog v-model="createOpen" :suggested-label="suggestedLabel" @create="handleCreate" />
    </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import InnerLoading from 'src/components/InnerLoading/index.vue';
import BudgetPeriodCard from 'src/components/Budget/BudgetPeriodCard.vue';
import BudgetPeriodDialog from 'src/components/Budget/BudgetPeriodDialog.vue';
import app from 'src/services/app';
import { ensureBudgetTemplate, useBudgetSettingsRef } from 'src/services/database/wrappers/budget';
import { createBudgetId, createPeriodData, nextPeriodSeq, suggestNextLabel } from 'src/domain/budget/defaults';
import type { BudgetCategory } from 'src/domain/budget/types';
import type { BudgetPeriodDBData } from 'src/models/database';

const $q = useQuasar()

const loading = ref(true)
const periods = ref<BudgetPeriodDBData[]>([])
const createOpen = ref(false)
const settingsRef = useBudgetSettingsRef()

const accounts = computed(() => settingsRef.value.savingsAccounts ?? [])
const suggestedLabel = computed(() => suggestNextLabel(periods.value))

let reloadTimer: ReturnType<typeof setTimeout> | undefined

const loadPeriods = async () => {
    periods.value = await app.userDb!.fetchBudgetPeriods()
}

const scheduleReload = () => {
    if (reloadTimer) clearTimeout(reloadTimer)
    reloadTimer = setTimeout(() => {
        reloadTimer = undefined
        void loadPeriods()
    }, 600)
}

onMounted(async () => {
    try {
        await settingsRef.initFromDB()
        if (!settingsRef.value.savingsAccounts) settingsRef.value.savingsAccounts = []
        await loadPeriods()
    } catch (error) {
        console.error('Не удалось загрузить бюджетирование:', error)
        $q.notify({ type: 'negative', message: 'Не удалось загрузить периоды бюджета' })
    } finally {
        loading.value = false
    }
})

onBeforeUnmount(() => {
    if (reloadTimer) clearTimeout(reloadTimer)
})

const ensureAccount = (name: string): string => {
    const accountsList = settingsRef.value.savingsAccounts || (settingsRef.value.savingsAccounts = [])
    const existing = accountsList.find(account => account.name.toLowerCase() === name.toLowerCase())
    if (existing) return existing.id

    const account = {
        id: createBudgetId(),
        name,
        initialBalance: 0,
        createdAt: new Date().toISOString(),
    }
    accountsList.push(account)
    return account.id
}

const removeAccount = (accountId: string) => {
    const accountsList = settingsRef.value.savingsAccounts || []
    settingsRef.value.savingsAccounts = accountsList.filter(account => account.id !== accountId)
}

const setAccountInitial = (accountId: string, value: number) => {
    const account = (settingsRef.value.savingsAccounts || []).find(item => item.id === accountId)
    if (account) account.initialBalance = value
}

const handleCreate = async (payload: { label: string, incomeName: string, incomeAmount: number }) => {
    try {
        const categories = await ensureBudgetTemplate()
        const data = createPeriodData({
            label: payload.label,
            seq: nextPeriodSeq(periods.value),
            categories,
            incomeName: payload.incomeName,
            incomeAmount: payload.incomeAmount,
        })
        await app.userDb!.createBudgetPeriod(data)
        await loadPeriods()
    } catch (error) {
        console.error('Не удалось создать период бюджета:', error)
        $q.notify({ type: 'negative', message: 'Не удалось создать период' })
    }
}

const handleDelete = async (docId: string) => {
    await app.userDb!.removeBudgetPeriod(docId)
    await loadPeriods()
}

const handleMakeTemplate = async (categories: BudgetCategory[]) => {
    try {
        const snapshot = categories.map(category => ({
            ...category,
            children: category.children.map(child => ({ ...child })),
        }))
        const template = await app.userDb!.fetchBudgetTemplate()
        if (template) await app.userDb!.saveBudgetTemplate({ ...template, categories: snapshot })
        else await app.userDb!.createBudgetTemplate(snapshot)
        $q.notify({ type: 'positive', message: 'Шаблон обновлён' })
    } catch (error) {
        console.error('Не удалось сохранить шаблон статей:', error)
        $q.notify({ type: 'negative', message: 'Не удалось сохранить шаблон' })
    }
}
</script>

<style lang="scss" scoped>
.budget-page {
    padding: 10px 16px 20px;
    max-width: 1100px;
}

.budget-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}

.budget-title {
    color: #111827;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.25;
}

.budget-subtitle {
    margin-top: 2px;
    color: #6b7280;
    font-size: 12px;
}

.budget-add {
    flex: 0 0 auto;
    white-space: nowrap;
}

.budget-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.budget-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
    padding: 36px 20px;
    border: 1px dashed #d1d5db;
    border-radius: 12px;
    color: #64748b;
    text-align: center;
}

.budget-empty__title {
    color: #111827;
    font-size: 16px;
    font-weight: 600;
}

.budget-empty__text {
    max-width: 460px;
    font-size: 13px;
    line-height: 1.45;
}

@media (max-width: 599px) {
    .budget-page {
        padding: 8px 8px 16px;
    }

    .budget-head {
        align-items: center;
    }

    .budget-title {
        font-size: 16px;
    }
}
</style>
