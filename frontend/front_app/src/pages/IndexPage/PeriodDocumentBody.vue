<template>
    <div class="page-container">
        <!-- Исходные данные -->
        <div class="grid-item-source">
            <q-card class="full-height">
                <q-card-section class="card-title-section">
                    <div class="text-subtitle1 card-title-text">Исходные данные</div>
                </q-card-section>
                <!-- <q-separator></q-separator> -->
                <q-card-section class="no-padding card-table-section">
                    <q-table square flat class="full-height page-table" :columns="InitAndCurrentDataColumns"
                        :rows="InitDataRows" hide-header dense :rows-per-page="[0]"
                        v-model:pagination="initCurrentPagination" hide-bottom separator="cell"></q-table>
                </q-card-section>
            </q-card>
        </div>

        <!-- Текущие данные -->
        <div class="grid-item-current">
            <q-card class="full-height">
                <q-card-section class="card-title-section">
                    <div class="text-subtitle1 card-title-text">Текущие данные</div>
                </q-card-section>
                <!-- <q-separator></q-separator> -->
                <q-card-section class="no-padding card-table-section">
                    <q-table square flat class="full-height page-table" :columns="InitAndCurrentDataColumns"
                        :rows="CurrentDataRows" hide-header dense :rows-per-page="[0]"
                        v-model:pagination="initCurrentPagination" hide-bottom separator="cell"></q-table>
                </q-card-section>
            </q-card>
        </div>

        <!-- Результат -->
        <div class="grid-item-result">
            <q-card class="full-height">
                <q-card-section class="card-title-section">
                    <div class="text-subtitle1 card-title-text">
                        <span>Календарь</span>
                        <q-space />
                        <div class="row items-center q-gutter-x-sm q-pr-sm">
                            <q-btn icon="calendar_month" flat round @click="handleEdit" />
                        </div>
                    </div>
                </q-card-section>
                <q-card-section class="no-padding card-table-section">
                    <q-table square flat class="full-height page-table" :columns="CalendarDataColumns"
                        :rows="calendarDataRows" dense :rows-per-page="[0]" v-model:pagination="initCurrentPagination"
                        hide-bottom separator="cell">
                        <template #body="props">
                            <q-tr :props="props" :class="{ 'bg-red-2': props.row.date.isWeekend() }">
                                <q-td>
                                    {{ props.row.date.friendly }}
                                </q-td>
                                <q-td>
                                    {{ props.row.day_of_week }}
                                </q-td>
                                <q-td>
                                    {{ props.row.plan }}
                                </q-td>
                                <q-td>
                                    {{ props.row.fact }}
                                </q-td>
                            </q-tr>
                        </template>
                    </q-table>
                </q-card-section>
            </q-card>
        </div>
    </div>
</template>

<script setup lang="ts">
import { CurrentDataFields, CurrentDataFieldsMap, InitDataFields, InitDataFieldsMap } from 'src/models/wallet';
import { CalendarDataColumns, InitAndCurrentBaseRow, InitAndCurrentDataColumns } from './models';
import { onMounted, ref, shallowRef, toRefs } from 'vue';
import { PeriodDocumentDBData } from 'src/models/database';
import { AppDate } from 'src/utils/date';

const initCurrentPagination = ref({ rowsPerPage: 0 })

interface Props {
    document: PeriodDocumentDBData
}

const props = defineProps<Props>()

const { document } = props


const getDaysInPeriod = (): AppDate[] => {
    const [aFromDate, aToDate] = [
        AppDate.fromFriendlyFormat(document.data.from_date),
        AppDate.fromFriendlyFormat(document.data.to_date)
    ]
    console.log(aFromDate, aToDate)

    const days: AppDate[] = []
    for (let aDate = aFromDate; aDate.date <= aToDate.date; aDate = aDate.add({ days: 1 })) {
        days.push(aDate)
    }
    return days
}


onMounted(async () => {
    const days = getDaysInPeriod()
    calendarDataRows.value = days.map(date => ({
        date: date,
        day_of_week: date.dayOfWeekString,
        plan: 1000,
        fact: 1000,
    }))
})

const calendarDataRows = shallowRef([])

const InitDataRows = shallowRef<InitAndCurrentBaseRow<InitDataFieldsMap>[]>([
    {
        name: InitDataFields.total_budget,
        value: 0,
        label: 'Общий бюджет',
        type: 'input',
    },
    {
        name: InitDataFields.weekend_plan,
        value: 0,
        label: 'План на выходные',
        type: 'input',
    },
    {
        name: InitDataFields.total_days,
        value: 0,
        label: 'Всего дней',
        type: 'text',
    },
    {
        name: InitDataFields.weekend_days,
        value: 0,
        label: 'Выходных дней',
        type: 'text',
    },
    {
        name: InitDataFields.weekday_days,
        value: 0,
        label: 'Будних дней',
        type: 'text',
    },

    {
        name: InitDataFields.total_weekends_budget,
        value: 0,
        label: 'Бюджет на выходные',
        type: 'text',
    },

    {
        name: InitDataFields.total_weekdays_budget,
        value: 0,
        label: 'Бюджет на будни',
        type: 'text',
    },

    {
        name: InitDataFields.initial_plan,
        value: 0,
        label: 'Начальный план',
        type: 'text',
    },
])

const CurrentDataRows = shallowRef<InitAndCurrentBaseRow<CurrentDataFieldsMap>[]>([
    {
        name: CurrentDataFields.current_date,
        value: 0,
        label: 'Текущая дата',
        type: 'text',
    },
    {
        name: CurrentDataFields.days_remaining,
        value: 0,
        label: 'Осталось дней',
        type: 'text',
    },
    {
        name: CurrentDataFields.weekends_remaining,
        value: 0,
        label: 'Осталось выходных',
        type: 'text',
    },
    {
        name: CurrentDataFields.weekdays_remaining,
        value: 0,
        label: 'Осталось будних',
        type: 'text',
    },
    {
        name: CurrentDataFields.total_spent_actual,
        value: 0,
        label: 'Всего потрачено',
        type: 'text',
    },
    {
        name: CurrentDataFields.spent_on_weekends,
        value: 0,
        label: 'Потрачено выходные',
        type: 'text',
    },
    {
        name: CurrentDataFields.spent_on_weekdays,
        value: 0,
        label: 'Потрачено будни',
        type: 'text',
    },
    {
        name: CurrentDataFields.total_remaining,
        value: 0,
        label: 'Общий остаток',
        type: 'text',
    },
    {
        name: CurrentDataFields.remaining_for_weekends,
        value: 0,
        label: 'Остаток выходные',
        type: 'text',
    },
    {
        name: CurrentDataFields.remaining_for_weekdays,
        value: 0,
        label: 'Остаток будни',
        type: 'text',
    },
    {
        name: CurrentDataFields.plan_for_today,
        value: 0,
        label: 'План на сегодня',
        type: 'text',
    },
])

</script>

<style lang="scss" scoped>
.page-container {
    display: grid;
    gap: 16px;

    // Мобильная версия - вертикальная компоновка
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr;
    grid-template-areas:
        "source"
        "current"
        "result";

    .grid-item-source {
        grid-area: source;
    }

    .grid-item-current {
        grid-area: current;
    }

    .grid-item-result {
        grid-area: result;
    }

    // Десктопная версия - двухколоночная компоновка
    @media (min-width: 1024px) {
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        grid-template-areas:
            "result source"
            "result current";

    }

    .card-title-section {
        height: 50px;
        padding: 0;

        .card-title-text {
            height: 100%;
            display: flex;
            flex-direction: row;
            align-items: center;
            padding-left: 16px;
        }
    }

    .card-table-section {
        height: calc(100% - 50px);

        .page-table {
            border-top: 1px solid $table-border-color;
            border-bottom-left-radius: $generic-border-radius;
            border-bottom-right-radius: $generic-border-radius;

            :deep(tr:last-child td) {
                border-bottom: 1px solid $table-border-color;
            }
        }
    }
}
</style>
