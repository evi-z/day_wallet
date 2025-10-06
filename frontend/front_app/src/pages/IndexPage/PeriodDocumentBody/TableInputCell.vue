<template>
    <q-td :key="tdKey" :props="tdProps" class="no-padding">
        <q-input class="cell-input-box" mask="#######" input-class="cell-input-field text-right q-px-md q-py-none" dense
            v-model.number="inputValue" @focus="handleFocus" @blur="handleBlur" ref="inputRef" @keyup.enter="handleEnter" />
    </q-td>
</template>

<script setup lang="ts">
import { QTableSlots } from 'quasar';
import { toRefs, ref, watch } from 'vue';
import { QInput } from 'quasar';

interface Props {
    tdKey: string,
    tdProps: Parameters<QTableSlots['body']>[0],
}

const props = defineProps<Props>()
const { tdProps } = toRefs(props)
const { tdKey } = props

const value = defineModel<any>({ required: true })
const inputValue = ref<string>(value.value)
watch(value, () => {
    inputValue.value = value.value
})
const inputRef = ref<QInput>()

const handleFocus = () => {
    inputRef.value?.select()
}

const handleBlur = () => {
    value.value = inputValue.value
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
