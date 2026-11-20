<template>
    <q-dialog v-model="open" :maximized="$q.screen.lt.sm" persistent>
        <q-card class="structure-card">
            <q-bar class="structure-bar">
                <q-icon name="sym_o_account_tree" size="18px" />
                <span class="q-ml-xs">Статьи периода</span>
                <q-space />
                <q-btn dense flat icon="close" @click="close" />
            </q-bar>

            <q-card-section class="structure-body">
                <div class="structure-hint">
                    Статьи задают, куда распределять приходы. Сберегательный счёт получает
                    распределения из периода и может иметь ручное дополнительное пополнение.
                </div>

                <div v-for="(category, index) in draft" :key="category.id" class="structure-category">
                    <div class="structure-row structure-row--category">
                        <q-input v-model="category.name" dense outlined placeholder="Статья" class="structure-name" />
                        <q-select v-model="category.savingsAccountId" :options="savingsOptions"
                            option-value="value" option-label="label" emit-value map-options dense outlined
                            class="structure-savings" label="Счёт" clearable />
                        <q-btn flat round dense icon="sym_o_add" @click="addAccountFor(category, 'category')">
                            <q-tooltip>Новый сберегательный счёт</q-tooltip>
                        </q-btn>
                        <q-btn flat round dense icon="sym_o_add" @click="addChild(category)">
                            <q-tooltip>Добавить подстатью</q-tooltip>
                        </q-btn>
                        <q-btn flat round dense icon="sym_o_delete" class="structure-delete"
                            @click="removeCategory(category, index)">
                            <q-tooltip>Удалить статью</q-tooltip>
                        </q-btn>
                    </div>

                    <div v-for="(child, childIndex) in category.children" :key="child.id"
                        class="structure-row structure-row--sub">
                        <q-input v-model="child.name" dense outlined placeholder="Подстатья"
                            class="structure-name" />
                        <q-select v-model="child.savingsAccountId" :options="savingsOptions"
                            option-value="value" option-label="label" emit-value map-options dense outlined
                            class="structure-savings" label="Счёт" clearable />
                        <q-btn flat round dense icon="sym_o_add" @click="addAccountFor(child, 'sub')">
                            <q-tooltip>Новый сберегательный счёт</q-tooltip>
                        </q-btn>
                        <q-btn flat round dense icon="sym_o_delete" class="structure-delete"
                            @click="removeChild(category, childIndex)">
                            <q-tooltip>Удалить подстатью</q-tooltip>
                        </q-btn>
                    </div>
                </div>

                <q-btn flat no-caps color="primary" icon="sym_o_add" label="Добавить статью"
                    class="structure-add" @click="addCategory" />
            </q-card-section>

            <q-separator />
            <q-card-actions align="right" class="q-pa-sm">
                <q-btn flat no-caps label="Отмена" @click="close" />
                <q-btn unelevated no-caps color="primary" label="Сохранить" @click="save" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { createBudgetId } from 'src/domain/budget/defaults';
import type { BudgetCategory, BudgetSavingsAccount, BudgetSubcategory } from 'src/domain/budget/types';

const props = defineProps<{
    modelValue: boolean,
    categories: BudgetCategory[],
    accounts: BudgetSavingsAccount[],
    hasAllocations: (leafId: string) => boolean,
    ensureAccount: (name: string) => string,
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean],
    save: [categories: BudgetCategory[]],
}>()

const $q = useQuasar()

const open = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
})

const draft = ref<BudgetCategory[]>([])

const clone = (categories: BudgetCategory[]): BudgetCategory[] => categories.map(category => ({
    ...category,
    children: category.children.map(child => ({ ...child })),
}))

watch(() => props.modelValue, (isOpen) => {
    if (isOpen) draft.value = clone(props.categories)
}, { immediate: true })

const savingsOptions = computed(() => props.accounts.map(account => ({
    label: account.name,
    value: account.id,
})))

const close = () => { open.value = false }

const save = () => {
    const cleaned = draft.value
        .map(category => ({
            ...category,
            name: category.name.trim() || 'Без названия',
            savingsAccountId: category.children.length ? undefined : category.savingsAccountId || undefined,
            children: category.children.map(child => ({
                ...child,
                name: child.name.trim() || 'Без названия',
                savingsAccountId: child.savingsAccountId || undefined,
            })),
        }))
    emit('save', cleaned)
    close()
}

const addCategory = () => {
    draft.value.push({ id: createBudgetId(), name: '', children: [] })
}

const addChild = (category: BudgetCategory) => {
    if (props.hasAllocations(category.id)) {
        $q.notify({
            type: 'warning',
            message: 'По статье уже есть распределения. Сначала обнулите их, потом добавляйте подстатьи.',
        })
        return
    }
    category.savingsAccountId = undefined
    category.children.push({ id: createBudgetId(), name: '' })
}

const removeCategory = (category: BudgetCategory, index: number) => {
    const leafId = category.children.length ? undefined : category.id
    if (leafId && props.hasAllocations(leafId)) {
        $q.notify({ type: 'warning', message: 'По статье есть распределения. Сначала обнулите их.' })
        return
    }
    if (category.children.some(child => props.hasAllocations(child.id))) {
        $q.notify({ type: 'warning', message: 'По подстатьям есть распределения. Сначала обнулите их.' })
        return
    }
    draft.value.splice(index, 1)
}

const removeChild = (category: BudgetCategory, index: number) => {
    const child = category.children[index]
    if (child && props.hasAllocations(child.id)) {
        $q.notify({ type: 'warning', message: 'По подстатье есть распределения. Сначала обнулите их.' })
        return
    }
    category.children.splice(index, 1)
}

const addAccountFor = (node: BudgetCategory | BudgetSubcategory, kind: 'category' | 'sub') => {
    $q.dialog({
        title: 'Новый сберегательный счёт',
        message: 'Название счёта: например, «Подушка» или «Авто».',
        prompt: {
            model: node.name || '',
            type: 'text',
            isValid: value => !!String(value).trim(),
        },
        cancel: { label: 'Отмена', flat: true },
        ok: { label: 'Создать', color: 'primary', flat: true },
        persistent: true,
    }).onOk((name: string) => {
        const accountId = props.ensureAccount(String(name).trim())
        if (kind === 'category') draft.value = draft.value.map(item =>
            item.id === node.id ? { ...item, savingsAccountId: accountId } : item
        )
        else {
            for (const category of draft.value) {
                category.children = category.children.map(child =>
                    child.id === node.id ? { ...child, savingsAccountId: accountId } : child
                )
            }
        }
    })
}
</script>

<style lang="scss" scoped>
.structure-card {
    width: 760px;
    max-width: 96vw;
}

.structure-bar {
    background: #065f46;
    color: #fff;
    font-size: 13px;
}

.structure-body {
    max-height: 66vh;
    overflow: auto;
}

.structure-hint {
    margin-bottom: 10px;
    color: #6b7280;
    font-size: 12px;
    line-height: 1.4;
}

.structure-category {
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #f1f5f9;
}

.structure-row {
    display: flex;
    align-items: center;
    gap: 6px;
}

.structure-row--sub {
    padding-left: 18px;
}

.structure-name {
    flex: 1 1 auto;
    min-width: 90px;
}

.structure-savings {
    flex: 0 0 170px;
    width: 170px;
}

.structure-delete {
    color: #b91c1c;
}

.structure-add {
    margin-top: 4px;
}

@media (max-width: 599px) {
    .structure-row {
        flex-wrap: wrap;
    }

    .structure-savings {
        flex: 1 1 140px;
        width: auto;
    }
}
</style>
