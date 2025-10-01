<template>
    <q-date class="calendar" v-model="value" subtitle="Период" range @range-start="handleRangeStart"
        @range-end="handleRangeEnd" :title="calendarTitle" :mask="FRIENDLY_DATE_FORMAT"></q-date>
</template>

<script setup lang="ts">
import { date, QDateProps } from 'quasar';
import { FRIENDLY_DATE_FORMAT } from 'src/utils/date';
import { ref } from 'vue';
import { PeriodCalendarModel } from './models';

interface Props extends Omit<QDateProps, 'onUpdate:modelValue' | 'modelValue' | 'title' | 'subtitle' | 'range' | 'onRangeStart' | 'onRangeEnd'> { }

const value = defineModel<PeriodCalendarModel>({ required: true })

const calendarTitle = ref('Выберите период')

type onRangeDateArg = Parameters<NonNullable<QDateProps['onRangeStart']>>[0]

const foratOnRangeDate = (dt: onRangeDateArg): string => {
    return date.formatDate(date.buildDate(dt), FRIENDLY_DATE_FORMAT)
}

const handleRangeStart = (fromDate: onRangeDateArg) => {
    calendarTitle.value = `${foratOnRangeDate(fromDate)} -`
}

const handleRangeEnd = (period: Parameters<NonNullable<QDateProps['onRangeEnd']>>[0]) => {
    calendarTitle.value = `${foratOnRangeDate(period.from)} - ${foratOnRangeDate(period.to)}`
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
