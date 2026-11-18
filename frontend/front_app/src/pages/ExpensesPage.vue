<template>
    <q-page class="section-page">
        <div class="section-head">
            <div class="section-subtitle">Фактические операции и импорт выгрузок</div>
        </div>

        <q-card flat bordered class="empty-card">
            <q-card-section class="empty-card__body">
                <q-icon name="sym_o_receipt_long" size="40px" />
                <div class="empty-card__title">Импорт трат пока не подключён</div>
                <div class="empty-card__text">
                    Факты по-прежнему вводятся вручную в Пульсе. Выгрузки ЯПея остаются
                    в «Финансовом учёте» и не попадают сюда автоматически.
                </div>
                <q-btn outline color="primary" no-caps label="Загрузить выгрузку" disable />
            </q-card-section>
        </q-card>
    </q-page>
</template>

<style lang="scss" scoped>
.section-page {
    padding: 10px 16px 16px;
    max-width: 1100px;
}

.section-head {
    margin-bottom: 10px;
}

.section-subtitle {
    font-size: 12px;
    color: #6b7280;
}

.empty-card {
    border-radius: 10px;
}

.empty-card__body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 36px 20px;
    text-align: center;
    color: #64748b;
}

.empty-card__title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
}

.empty-card__text {
    max-width: 560px;
    font-size: 13px;
    line-height: 1.45;
}
</style>
