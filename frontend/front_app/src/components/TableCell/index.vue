<template>
    <q-td :key="tdKey" :props="tdProps" :class="cellClasses">
        <CellCurrencyInputBody v-if="cellType === TableCellType.input" :format-type="cellFormat" v-model="value"
            :align-content="alignContent" />
        <CellSpanBody v-else-if="cellType === TableCellType.text" :format-type="cellFormat" :value="value"
            :align-content="alignContent" />
    </q-td>
</template>

<script setup lang="ts">
import { QTableSlots } from 'quasar';
import { TableCellFormatType, TableCellFormatTypeMap, TableCellTypeMap, TableCellType, TableCellAlign } from './models';
import CellCurrencyInputBody from './CellCurrencyInputBody.vue';
import CellSpanBody from './CellSpanBody.vue';
import { computed, CSSProperties } from 'vue';

interface Props {
    tdKey: string,
    tdProps: Parameters<QTableSlots['body']>[0],
    cellType: TableCellTypeMap,
    cellFormat?: TableCellFormatTypeMap,
    alignContent?: TableCellAlign,
}

const {
    tdKey,
    tdProps,
    cellType,
    cellFormat = TableCellFormatType.plain,
    alignContent = 'right'
} = defineProps<Props>()

const value = defineModel<any>({ required: true })

const cellClasses = computed(() => {
    return {
        'cell-input': cellType === TableCellType.input
    }
})

</script>

<style lang="scss" scoped>
.cell-input {
    padding: 0 !important;
    // border-bottom: none !important;
}

</style>
