<template>
    <q-td :key="tdKey" :props="tdProps" class="no-padding">
        <q-input class="cell-input-box" input-class="cell-input-field text-right q-px-md q-py-none" dense
            v-model="value" @focus="handleFocus" ref="inputRef" />
    </q-td>
</template>



<script setup lang="ts">
import { QTableSlots } from 'quasar';
import { toRefs, ref } from 'vue';
import { QInput } from 'quasar';

interface Props {
    tdKey: string,
    tdProps: Parameters<QTableSlots['body']>[0],
}

const props = defineProps<Props>()
const { tdProps } = toRefs(props)
const { tdKey } = props

const value = defineModel<any>({ required: true })
const inputRef = ref<QInput>()

const handleFocus = () => {
    inputRef.value?.select()
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
