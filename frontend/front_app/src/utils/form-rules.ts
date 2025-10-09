export const reqRule = (message?: string) => {
    return (val: string | number) => !!val || message || "Обязательное поле";
};

/**
 * Правило для ограничения максимальной длинны текста
 * */
export const maxLengthRule = (max: number) => {
    return (val: string) =>
        val?.length <= max || `Длинна не должна превышать ${max} знаков`;
};
