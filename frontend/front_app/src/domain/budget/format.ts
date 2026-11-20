/** Отображение денег в бюджетировании. */

const moneyFormatter = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
})

/** «170 000 ₽» или «1 250,50 ₽» */
export const formatMoney = (value: number): string => {
    const num = Number.isFinite(value) ? value : 0
    return `${moneyFormatter.format(num)} ₽`
}

