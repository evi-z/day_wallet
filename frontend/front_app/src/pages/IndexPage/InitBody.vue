<template>
    <div class="page-container column flex-center">
        <q-form class="q-gutter-y-md column">
            <q-input v-model="form.name" outlined label="Название периода" autofocus></q-input>
            <q-separator />
            <PeriodCalendar v-model="form.period"></PeriodCalendar>
            <q-btn type="submit" color="primary" label="Создать" @click="handleCreate" :disabled="!state.createEnabled" />
        </q-form>
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
    loading: false,
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

    state.loading = true

    await app.userDb!.createPeriodDocument(formData).then(doc => {
        console.log('🔍 Doc:', doc)
        // emit('created', doc._id)
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
