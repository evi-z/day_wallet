<template>
    <q-page class="section-page">
        <div class="section-head">
            <div class="section-subtitle">Долгосрочный цикл, доходы и распределения</div>
        </div>

        <q-card flat bordered class="empty-card">
            <q-card-section class="empty-card__body">
                <q-icon name="sym_o_trending_up" size="40px" />
                <div class="empty-card__title">Долгосрочный план пока живёт в книге</div>
                <div class="empty-card__text">
                    «Финансовый учёт» остаётся источником истины. Здесь появится сводка цикла,
                    план/факт и траектория Подушки, когда дойдём до этого этапа.
                </div>
                <q-btn outline color="primary" no-caps label="Импортировать из книги" disable />
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
