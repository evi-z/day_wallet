<template>
    <q-input class="cell-input-box" :input-class="inputClass" dense
        v-model="formattedValue" @focus="handleFocus" @blur="handleBlur" ref="inputRef" @keyup.enter="handleEnter" />
</template>

<script setup lang="ts">
import { QTableSlots } from 'quasar';
import { toRefs, ref, watch, computed, watchEffect } from 'vue';
import { QInput } from 'quasar';
import { useCurrencyInput } from 'vue-currency-input';
import { TableCellAlign, TableCellFormatType, TableCellFormatTypeMap } from './models';

interface Props {
    formatType?: TableCellFormatTypeMap,
    alignContent?: TableCellAlign,
}

const props = withDefaults(defineProps<Props>(), {
    formatType: TableCellFormatType.plain,
})
const { formatType, alignContent } = toRefs(props)

const value = defineModel<any>({ required: true })

const inputClass = computed(() => {
    return `cell-input-field text-${alignContent.value} q-px-md q-py-none`
})

const { inputRef, formattedValue, numberValue, setValue } = useCurrencyInput({
    currency: 'RUB',
    locale: 'ru-RU',
    precision: 0,
    useGrouping: true,
}, false)

watch(value, (val) => {  // Изменение значения извне компонента
    setValue(val)
    console.log('Watch', val, formattedValue.value, numberValue.value)
}, { immediate: false })

const handleFocus = () => {
    inputRef.value?.select()
}

const handleBlur = () => {
    console.log('Blur', value.value, formattedValue.value, numberValue.value)
    value.value = numberValue.value
}

const handleEnter = () => {
    inputRef.value?.blur()
}

</script>

<style lang="scss" scoped>
.cell-input-box {
    :deep(.q-field__control) {
        height: unset;
    }
}

:deep(.cell-input-field) {
    font-size: $table-tbody-td-font-size;
}
</style>
