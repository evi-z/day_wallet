<template>
    <div class="fit" :class="boxClass">
        <span>{{ displayValue }}</span>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TableCellFormatType, TableCellFormatTypeMap, TableCellAlign } from './models';

interface Props {
    value: any,
    formatType?: TableCellFormatTypeMap,
    alignContent: TableCellAlign,
}

const {
    value,
    formatType = TableCellFormatType.plain,
    alignContent
} = defineProps<Props>()

const boxClass = computed(() => {
    return `fit text-${alignContent}`
})

const formatCurrency = (val: number) => {
    return Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0
    }).format(val)
}

const displayValue = computed(() => {
    if (formatType === TableCellFormatType.currency) return formatCurrency(value)
    return value
})

</script>

<style lang="scss" scoped></style>
