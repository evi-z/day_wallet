import { PeriodDocumentCalendarFactValuesData, PeriodDocumentCalendarFactValuesDBData, PeriodDocumentDBData, PeriodDocumentFormData, PeriodDocumentMainValuesData, PeriodDocumentMainValuesDBData, UserDBDataType } from 'src/models/database'
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

    /** Получает все документы периода */
    async fetchPeriodDocuments() {
        return this._findByType<PeriodDocumentDBData>(UserDBDataType.document)
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
}
