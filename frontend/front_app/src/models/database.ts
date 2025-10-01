export type DatabaseDocumentBaseData<T extends string = string, D extends object = object> = PouchDB.Core.ExistingDocument<{
    /** Базовые данные для всех документов */

    type: T,
    data: D,
    created_at: string,
    updated_at: string
}>

export const UserDBDataType = {  /** Типы данных для БД пользователя */
    document: 'document'
} as const

export type UserDBDataType = typeof UserDBDataType[keyof typeof UserDBDataType]

/** Базовый тип данных для БД пользователя */
export type UserDBBaseData<T extends object = object> = DatabaseDocumentBaseData<UserDBDataType, T>

/** Форма данных документа периода (создание) */
export type PeriodDocumentFormData = {
    name: string,
    from_date: string,
    to_date: string,
}

// Данные документа периода (из БД)
export type PeriodDocumentDBData = UserDBBaseData<PeriodDocumentFormData>
