<template>
    <div class="fit" :class="boxClass">
        <span>{{ displayValue }}</span>
    </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { TableCellFormatType,  TableCellFormatTypeMap, TableCellAlign } from './models';

interface Props {
    value: any,
    formatType?: TableCellFormatTypeMap,
    alignContent?: TableCellAlign,
}

const props = defineProps<Props>()
const { value, formatType, alignContent } = toRefs(props)

const boxClass = computed(() => {
    return `fit text-${alignContent.value}`
})

const formatCurrency = (val: number) => {
    return Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0
    }).format(val)
}

const displayValue = computed(() => {
    if (formatType.value === TableCellFormatType.currency) return formatCurrency(value.value)
    return value.value
})

</script>

<style lang="scss" scoped></style>
