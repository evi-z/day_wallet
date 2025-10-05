import { PeriodDocInitRowValues } from "src/pages/IndexPage/PeriodDocumentBody/models"

export type DatabaseTypeDocumentBaseData<T extends string = string, D extends object = object> = D & PouchDB.Core.ExistingDocument<{
    /** Базовый тип документа с типом */

    type: T,
}>

export type DatabaseTypeDocumentAuditData<T extends string = string, D extends object = object> = DatabaseTypeDocumentBaseData<T, D> & {
    /** Базовый тип документа с типом и датами создания и обновления */

    created_at: string,
    updated_at: string
}

export const UserDBDataType = {  /** Типы данных для БД пользователя */
    document: 'document',
    document_main_values: 'document_main_values',
    document_calendar_values: 'document_calendar_values'
} as const

export type UserDBDataType = typeof UserDBDataType[keyof typeof UserDBDataType]

/** Базовый тип данных для БД пользователя */
export type UserDBBaseData<D extends object = object> = DatabaseTypeDocumentBaseData<UserDBDataType, D>

/** Базовый тип данных для БД пользователя с датами создания и обновления */
export type UserDBAuditData<D extends object = object> = DatabaseTypeDocumentAuditData<UserDBDataType, D>

/** Базовый тип данных для связи с документом периода */
export type BasePeriodDocumentRelationDocument<D extends object = object> = UserDBBaseData<D> & {
    document_id: string,
}

/** Форма данных документа периода (создание) */
export type PeriodDocumentFormData = {
    name: string,
    from_date: string,
    to_date: string,
}

// Данные документа периода (из БД)
export type PeriodDocumentDBData = UserDBAuditData<PeriodDocumentFormData>

/** Основные значения для инициализации документа периода */
export type PeriodDocumentInitMainValues = Pick<PeriodDocInitRowValues, 'total_budget' | 'weekend_plan'>

export type PeriodDocumentMainValuesData = {
    init_values: PeriodDocumentInitMainValues,
}

export type PeriodDocumentMainValuesDBData = BasePeriodDocumentRelationDocument<PeriodDocumentMainValuesData>
