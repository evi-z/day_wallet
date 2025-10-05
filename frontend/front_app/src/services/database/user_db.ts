import { PeriodDocumentDBData, PeriodDocumentFormData, PeriodDocumentMainValuesData, PeriodDocumentMainValuesDBData, UserDBDataType } from 'src/models/database'
import { BaseTypeDatabaseService } from './base'

const PERFIX_DATABASE_NAME = 'day-wallet-user-db'
const LOCAL_USER_ID = 'local'


export class UserDatabaseService extends BaseTypeDatabaseService<UserDBDataType> {
    /** База данных для пользователя */

    constructor(userId: string | null) {
        /**
         * Тут потом надо будет принимать пользователя из ID юзера
         * */
        const databaseName = PERFIX_DATABASE_NAME + '-' + (userId || LOCAL_USER_ID)
        super(databaseName)
        this.db.createIndex({
            index: {
                fields: ['document_id']
            }
        })
    }

    async createPeriodDocument(from: PeriodDocumentFormData) {
        /** Создаёт новый документ периода */

        return this._createAuditTypeDocument(UserDBDataType.document, from)
    }

    async fetchPeriodDocuments() {
        /** Получает все документы периода */

        return this._findByType<PeriodDocumentDBData>(UserDBDataType.document)
    }

    async removePeriodDocument(documentId: string) {
        /** Удаляет документ периода и связанные документы */

        return this.removeDocumentById(documentId).then(() => {  // Удаляем документ периода
            return this._removeDocumentsByFind({  // Удаляем связанные документы
                selector: {
                    document_id: documentId
                }
            })
        })
    }

    async fetchPeriodDocumentMainValues(documentId: string) {
        /** Получает основные значения документа периода */

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
}
