<template>
    <q-page class="section-page">
        <div class="section-head">
            <div class="section-subtitle">Бюджетные контуры, а не банковские счета</div>
            <q-btn outline color="primary" no-caps icon="sym_o_add" label="Добавить счёт" disable>
                <q-tooltip>Появится вместе с моделью счетов</q-tooltip>
            </q-btn>
        </div>

        <div class="accounts-grid">
            <q-card flat bordered class="account-card">
                <q-card-section>
                    <div class="row items-start justify-between no-wrap q-gutter-x-sm">
                        <div>
                            <div class="text-subtitle1 text-weight-medium">Жизнь</div>
                            <div class="text-caption text-grey-7 q-mt-xs">Повседневный бюджет: периоды и дневные факты</div>
                        </div>
                        <q-badge outline color="primary">текущий</q-badge>
                    </div>
                </q-card-section>
                <q-separator />
                <q-card-actions align="right">
                    <q-btn flat dense no-caps color="primary" label="Открыть Пульс" :to="{ name: PAGES.Pulse }" />
                </q-card-actions>
            </q-card>

            <div class="account-stub">
                <q-icon name="sym_o_add_circle" size="30px" />
                <div class="text-subtitle2">Другие контуры</div>
                <div class="text-caption text-grey-6 text-center">Операционка, Подушка и целевые контуры появятся позже</div>
            </div>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { PAGES } from 'src/router/models';
</script>

<style lang="scss" scoped>
.section-page {
    padding: 10px 16px 16px;
    max-width: 1100px;
}

.section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 10px;
}

.section-subtitle {
    font-size: 12px;
    color: #6b7280;
}

.accounts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 340px));
    gap: 12px;
}

.account-card {
    border-radius: 10px;
}

.account-stub {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 132px;
    padding: 16px;
    color: #64748b;
    border: 1px dashed #cbd5e1;
    border-radius: 10px;
}
</style>
