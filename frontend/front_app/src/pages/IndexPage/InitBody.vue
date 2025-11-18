<template>
    <div class="page-container column flex-center">

        <div class="q-gutter-y-md column">
            <q-input v-model="form.name" outlined label="Название периода" autofocus :maxlength="22"></q-input>
            <q-separator />
            <PeriodCalendar v-model="form.period"></PeriodCalendar>
            <q-btn color="primary" label="Создать" @click="handleCreate" :disabled="!state.createEnabled"
                :loading="state.createLoading" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { PeriodDocumentFormData } from 'src/models/database';
import { reactive, ref, watchEffect } from 'vue';
import PeriodCalendar from 'src/components/PeriodCalendar/index.vue';
import { PeriodCalendarModel } from 'src/components/PeriodCalendar/models';
import app from 'src/services/app';

const state = reactive({
    createEnabled: false,
    createLoading: false,
})

type NewPeriodDocumentForm = {
    name: string,
    period: PeriodCalendarModel,
}

const form = ref<NewPeriodDocumentForm>({
    name: '',
    period: { from: '', to: '' } as PeriodCalendarModel,
})

const emit = defineEmits<{
    created: [key: string]
}>()

watchEffect(() => {
    state.createEnabled = !!(form.value.name && form.value.period.from && form.value.period.to)
})

const handleCreate = async () => {
    const formData: PeriodDocumentFormData = {
        name: form.value.name,
        from_date: form.value.period.from,
        to_date: form.value.period.to,
    }

    state.createLoading = true
    await app.userDb!.createPeriodDocument(formData).then(doc => {
        if (!doc.ok) throw new Error('❌ Error create period document (not ok response):\n' + String(doc))

        // app.userDb!.getByIdOrNull(doc.id).then(doc => {
        //     console.log('🔍 Period document:', doc)
        // })

        emit('created', doc.id)
    }).finally(() => {
        state.createLoading = false
    })
}

</script>

<style lang="scss" scoped>
.calendar {

    :deep(.q-date__header-subtitle) {
        pointer-events: none;
    }

    :deep(.q-date__header-title-label) {
        font-size: 22px;
        pointer-events: none;
    }
}
</style>
