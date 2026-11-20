import { BudgetPeriodDBData, BudgetSettingsDBData, BudgetTemplateDBData, PeriodDocumentCalendarFactValuesData, PeriodDocumentCalendarFactValuesDBData, PeriodDocumentDBData, PeriodDocumentFormData, PeriodDocumentMainValuesData, PeriodDocumentMainValuesDBData, UserDBDataType } from 'src/models/database'
import type { BudgetCategory, BudgetPeriodData, BudgetSettingsData } from 'src/domain/budget/types'
import { createBudgetId } from 'src/domain/budget/defaults'
import { BaseTypeDatabaseService } from './base'
import { DBWithRemoteSync } from './mixins'

const LOCAL_USER_DATABASE_NAME = 'day-wallet-user-db-local'


export class UserDatabaseService extends DBWithRemoteSync(BaseTypeDatabaseService<UserDBDataType>) {
    /** База данных для пользователя */

    constructor(dbName: string | null) {
        /**
         * Тут потом надо будет принимать пользователя из ID юзера
         * */
        super(dbName ?? LOCAL_USER_DATABASE_NAME)
        this.db.createIndex({
            index: {
                fields: ['document_id']
            }
        })
    }

    /** Создаёт новый документ периода */
    async createPeriodDocument(from: PeriodDocumentFormData) {
        return this._createAuditTypeDocument(UserDBDataType.document, from)
    }

    /** Обновляет название и границы существующего документа периода */
    async updatePeriodDocument(document: PeriodDocumentDBData, data: PeriodDocumentFormData) {
        return this.db.put({
            ...document,
            ...data,
            updated_at: new Date().toISOString(),
        })
    }

    /** Получает все документы периода */
    async fetchPeriodDocuments() {
        return this._findByType<PeriodDocumentDBData>(
            UserDBDataType.document,
            { sort: ['type', 'created_at'] }
        )
    }

    /** Удаляет документ периода и связанные документы */
    async removePeriodDocument(documentId: string) {
        return this.removeDocumentById(documentId).then(() => {  // Удаляем документ периода
            return this._removeDocumentsByFind({  // Удаляем связанные документы
                selector: {
                    document_id: documentId
                }
            })
        })
    }

    /** Получает основные значения документа периода */
    async fetchPeriodDocumentMainValues(documentId: string) {
        return this._findOneOrNull<PeriodDocumentMainValuesDBData>({
            selector: {
                type: UserDBDataType.document_main_values,
                document_id: documentId
            }
        })
    }

    /** Устанавливает (создаёт или обновляет) основные значения документа периода */
    async setPeriodDocumentMainValues(documentId: string, values: PeriodDocumentMainValuesData) {
        return this.fetchPeriodDocumentMainValues(documentId).then(doc => {
            return this._createOrUpdateTypeDocument(doc, UserDBDataType.document_main_values, {
                document_id: documentId,
                ...values,
            } as PeriodDocumentMainValuesData & { document_id: string })
        })
    }

    /** Получает значения фактов календаря документа периода */
    async fetchPeriodDocumentCalendarFactValues(documentId: string) {
        return this._findOneOrNull<PeriodDocumentCalendarFactValuesDBData>({
            selector: {
                type: UserDBDataType.document_calendar_fact_values,
                document_id: documentId
            }
        })
    }

    /** Устанавливает (создаёт или обновляет) значения фактов календаря документа периода */
    async setPeriodDocumentCalendarFactValues(documentId: string, values: PeriodDocumentCalendarFactValuesData) {
        return this.fetchPeriodDocumentCalendarFactValues(documentId).then(doc => {
            return this._createOrUpdateTypeDocument(doc, UserDBDataType.document_calendar_fact_values, {
                document_id: documentId,
                ...values,
            } as PeriodDocumentCalendarFactValuesData & { document_id: string })
        })
    }

    /** Получает все периоды бюджетирования в порядке следования */
    async fetchBudgetPeriods() {
        // Сортировка в памяти: pouchdb-find требует готового индекса по seq,
        // а порядок периодов — предметное правило приложения, а не запроса.
        const docs = await this._findByType<BudgetPeriodDBData>(UserDBDataType.budget_period)
        return docs.sort((a, b) => (Number(a.seq) || 0) - (Number(b.seq) || 0))
    }

    /** Создаёт новый финансовый период бюджетирования */
    async createBudgetPeriod(data: BudgetPeriodData) {
        const now = new Date().toISOString()
        return this.db.put({
            _id: `budget_period:${createBudgetId()}`,
            type: UserDBDataType.budget_period,
            ...data,
            created_at: now,
            updated_at: now,
        })
    }

    /** Сохраняет существующий период бюджетирования */
    async saveBudgetPeriod(doc: BudgetPeriodDBData) {
        return this.db.put({
            ...doc,
            updated_at: new Date().toISOString(),
        })
    }

    /** Удаляет период бюджетирования */
    async removeBudgetPeriod(documentId: string) {
        return this.removeDocumentById(documentId)
    }

    /** Получает настройки бюджетирования */
    async fetchBudgetSettings() {
        return this.getByIdOrNull<BudgetSettingsDBData>('budget_settings')
    }

    /** Сохраняет настройки бюджетирования */
    async saveBudgetSettings(doc: BudgetSettingsDBData) {
        return this.db.put({
            ...doc,
            updated_at: new Date().toISOString(),
        })
    }

    /** Создаёт настройки бюджетирования по умолчанию */
    async createBudgetSettings(data: BudgetSettingsData = { savingsAccounts: [] }) {
        const now = new Date().toISOString()
        return this.db.put({
            _id: 'budget_settings',
            type: UserDBDataType.budget_settings,
            ...data,
            created_at: now,
            updated_at: now,
        })
    }

    /** Получает шаблон статей */
    async fetchBudgetTemplate() {
        return this.getByIdOrNull<BudgetTemplateDBData>('budget_template')
    }

    /** Сохраняет шаблон статей */
    async saveBudgetTemplate(doc: BudgetTemplateDBData) {
        return this.db.put({
            ...doc,
            updated_at: new Date().toISOString(),
        })
    }

    /** Создаёт шаблон статей */
    async createBudgetTemplate(categories: BudgetCategory[]) {
        const now = new Date().toISOString()
        return this.db.put({
            _id: 'budget_template',
            type: UserDBDataType.budget_template,
            categories,
            created_at: now,
            updated_at: now,
        })
    }
}
