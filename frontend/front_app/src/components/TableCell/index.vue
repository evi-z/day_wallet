<template>
    <q-td :key="tdKey" :props="tdProps" :class="{ 'no-padding': cellType === TableCellType.input }">
        <CellCurrencyInputBody v-if="cellType === TableCellType.input" :format-type="cellFormat" v-model="value"
            :align-content="alignContent" />
        <CellSpanBody v-else-if="cellType === TableCellType.text" :format-type="cellFormat" :value="value"
            :align-content="alignContent" />
    </q-td>
</template>

<script setup lang="ts">
import { QTableSlots } from 'quasar';
import { toRefs } from 'vue';
import { TableCellFormatType, TableCellFormatTypeMap, TableCellTypeMap, TableCellType, TableCellAlign } from './models';
import CellCurrencyInputBody from './CellCurrencyInputBody.vue';
import CellSpanBody from './CellSpanBody.vue';

interface Props {
    tdKey: string,
    tdProps: Parameters<QTableSlots['body']>[0],
    cellType: TableCellTypeMap,
    cellFormat?: TableCellFormatTypeMap,
    alignContent?: TableCellAlign,
}

const props = withDefaults(defineProps<Props>(), {
    cellFormat: TableCellFormatType.plain,
    alignContent: 'right'
})
const { tdProps, cellType, cellFormat, alignContent } = toRefs(props)
const { tdKey } = props

const value = defineModel<any>({ required: true })
</script>

<style lang="scss" scoped></style>
