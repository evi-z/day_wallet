<template>
    <div class="page-container column flex-center">
        <q-form class="q-gutter-y-md column">
            <q-input v-model="form.name" outlined label="Название периода" autofocus></q-input>
            <q-separator />


            <q-date class="calendar" v-model="form.period" subtitle="Период" range @range-start="handleRangeStart"
                @range-end="handleRangeEnd" :title="calendarTitle"></q-date>
            <q-btn type="submit" color="primary" label="Создать" />
        </q-form>
    </div>
</template>

<script setup lang="ts">
import { date, QDateProps } from 'quasar';
import { computed, ref, watchEffect } from 'vue';


type PeriodRange = {
    from: string,
    to: string,
}

type NewWalletCallendarForm = {
    name: string,
    period: PeriodRange,
}

const form = ref<NewWalletCallendarForm>({
    name: '',
    period: { from: '', to: '' } as PeriodRange,
})

const calendarTitle = ref('Выберите период')

type onRangeDateArg = Parameters<NonNullable<QDateProps['onRangeStart']>>[0]

const foratOnRangeDate = (dt: onRangeDateArg): string => {
    return date.formatDate(date.buildDate(dt), 'DD.MM.YYYY')
}

const handleRangeStart = (fromDate: onRangeDateArg) => {
    calendarTitle.value = `${foratOnRangeDate(fromDate)} -`
}

const handleRangeEnd = (period: Parameters<NonNullable<QDateProps['onRangeEnd']>>[0]) => {
    calendarTitle.value = `${foratOnRangeDate(period.from)} - ${foratOnRangeDate(period.to)}`
    // form.value.period.to = date
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
