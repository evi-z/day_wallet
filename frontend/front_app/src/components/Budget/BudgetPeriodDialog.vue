<template>
    <q-dialog v-model="open" :maximized="$q.screen.lt.sm" persistent>
        <q-card class="create-card">
            <q-bar class="create-bar">
                <q-icon name="sym_o_add_card" size="18px" />
                <span class="q-ml-xs">Новый финансовый период</span>
                <q-space />
                <q-btn dense flat icon="close" @click="close" />
            </q-bar>

            <q-card-section class="q-gutter-y-md">
                <q-input v-model="form.label" outlined dense label="Название периода"
                    placeholder="Например, Ноябрь 2026" :error="!!error" :error-message="error"
                    @update:model-value="error = ''" />

                <div class="create-hint">
                    Точные даты не нужны: период — это бакет для приходов и распределений.
                    Статьи возьмём из шаблона, их можно изменить позже.
                </div>

                <div class="create-row">
                    <q-input v-model="form.incomeName" outlined dense label="Первый приход"
                        placeholder="Зарплата" class="create-income-name" />
                    <MoneyInput v-model="form.incomeAmount" class="create-income-amount" />
                </div>
            </q-card-section>

            <q-separator />
            <q-card-actions align="right" class="q-pa-sm">
                <q-btn flat no-caps label="Отмена" @click="close" />
                <q-btn unelevated no-caps color="primary" label="Создать период" @click="submit" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import MoneyInput from 'src/components/MoneyInput/index.vue';

const props = defineProps<{
    modelValue: boolean,
    suggestedLabel: string,
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean],
    create: [payload: { label: string, incomeName: string, incomeAmount: number }],
}>()

const error = ref('')

const open = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
})

const form = reactive({
    label: '',
    incomeName: 'Зарплата',
    incomeAmount: 0,
})

watch(() => props.modelValue, (isOpen) => {
    if (!isOpen) return
    form.label = props.suggestedLabel
    form.incomeName = 'Зарплата'
    form.incomeAmount = 0
    error.value = ''
}, { immediate: true })

const close = () => { open.value = false }

const submit = () => {
    // MoneyInput обновляет v-model на blur: фиксируем сумму до чтения формы.
    ;(document.activeElement as HTMLElement | null)?.blur()

    const label = form.label.trim()
    if (!label) {
        error.value = 'Укажите название периода'
        return
    }

    emit('create', {
        label,
        incomeName: form.incomeName.trim() || 'Приход',
        incomeAmount: Number(form.incomeAmount) || 0,
    })
    close()
}
</script>

<style lang="scss" scoped>
.create-card {
    width: 520px;
    max-width: 96vw;
}

.create-bar {
    background: #065f46;
    color: #fff;
    font-size: 13px;
}

.create-hint {
    color: #6b7280;
    font-size: 12px;
    line-height: 1.45;
}

.create-row {
    display: flex;
    gap: 8px;
}

.create-income-name {
    flex: 1 1 auto;
}

.create-income-amount {
    flex: 0 0 150px;
    width: 150px;
}

@media (max-width: 599px) {
    .create-row {
        flex-direction: column;
    }

    .create-income-amount {
        width: auto;
        flex: 1 1 auto;
    }
}
</style>
