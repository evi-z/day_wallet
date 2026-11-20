import { PeriodDocInitDataFieldsMap } from "./period_doc"
import type { BudgetPeriodData, BudgetSettingsData, BudgetTemplateData } from "src/domain/budget/types"

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
    document: 'document',  // Документ периода
    document_main_values: 'document_main_values',  // Основные значения документа периода
    document_calendar_fact_values: 'document_calendar_fact_values',  // Значения фактов календаря
    budget_period: 'budget_period',  // Финансовый период бюджетирования
    budget_settings: 'budget_settings',  // Настройки бюджетирования (сберегательные счета)
    budget_template: 'budget_template',  // Шаблон статей для новых периодов
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
export type PeriodDocumentMainValuesData = Record<Extract<PeriodDocInitDataFieldsMap, 'total_budget' | 'weekend_plan'>, number> & {

}

export type PeriodDocumentMainValuesDBData = BasePeriodDocumentRelationDocument<PeriodDocumentMainValuesData>

/** Значения фактов календаря */
export type PeriodDocumentCalendarFactValuesData = Record<string, number>
export type PeriodDocumentCalendarFactValuesDBData = BasePeriodDocumentRelationDocument<PeriodDocumentCalendarFactValuesData>

/** Финансовый период бюджетирования: приходы, статьи и сбережения */
export type BudgetPeriodDBData = UserDBAuditData<BudgetPeriodData>

/** Настройки бюджетирования — один документ на пользователя */
export type BudgetSettingsDBData = UserDBAuditData<BudgetSettingsData>

/** Шаблон статей — один документ на пользователя */
export type BudgetTemplateDBData = UserDBAuditData<BudgetTemplateData>
