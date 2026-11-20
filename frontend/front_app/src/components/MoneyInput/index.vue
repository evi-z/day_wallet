<template>
    <q-input ref="inputRef" v-model="formattedValue" :label="label" :dense="dense" :outlined="outlined"
        :readonly="readonly" hide-bottom-space input-class="money-input__field" @focus="handleFocus"
        @blur="handleBlur" @keyup.enter="handleEnter" />
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useCurrencyInput } from 'vue-currency-input';

interface Props {
    label?: string,
    dense?: boolean,
    outlined?: boolean,
    readonly?: boolean,
}

withDefaults(defineProps<Props>(), {
    label: '',
    dense: true,
    outlined: true,
    readonly: false,
})

const value = defineModel<number>({ required: true })

const { inputRef, formattedValue, numberValue, setValue } = useCurrencyInput({
    currency: 'RUB',
    locale: 'ru-RU',
    // Целые значения без лишних нулей, дробные — до двух знаков.
    precision: { min: 0, max: 2 },
    useGrouping: true,
}, false)

watch(value, (val) => {
    if (val !== numberValue.value) setValue(val ?? 0)
}, { immediate: true })

// Отдаём значение наружу уже во время ввода, не дожидаясь blur:
// так форма не потеряет сумму, если пользователь сразу нажмёт кнопку.
watch(numberValue, (val) => {
    if (val === null || val === undefined) return
    if (val !== value.value) value.value = val
})

const handleFocus = () => inputRef.value?.select()
const handleBlur = () => { value.value = numberValue.value ?? 0 }
const handleEnter = () => inputRef.value?.blur()
</script>

<style lang="scss" scoped>
.money-input__field {
    text-align: right;
}
</style>
