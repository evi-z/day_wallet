import { DatabaseDocumentBaseData, PeriodDocumentDBData, PeriodDocumentFormData, UserDBBaseData, UserDBDataType } from 'src/models/database'
import { BaseDatabaseService } from './base'

const PERFIX_DATABASE_NAME = 'day-wallet-user-db'
const LOCAL_USER_ID = 'local'



export class UserDatabaseService extends BaseDatabaseService {
    /** База данных для пользователя */

    constructor(userId: string | null) {
        /**
         * Тут потом надо будет принимать пользователя из ID юзера
         * */
        const databaseName = PERFIX_DATABASE_NAME + '-' + (userId || LOCAL_USER_ID)
        super(databaseName)
        this.db.createIndex({
            index: {
                fields: ['type']
            }
        })
    }

    async _postData<T extends any>(type: UserDBDataType, data: T) {
        /** Добавляет новые данные в БД */

        return this.db.post({
            type,
            data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
    }


    async createPeriodDocument(from: PeriodDocumentFormData) {
        /** Создаёт новый документ периода */

        return this._postData(UserDBDataType.document, from)
    }

    async fetchPeriodDocuments() {
        /** Получает все документы периода */

        return this.find<PeriodDocumentDBData>({
            selector: {
                type: UserDBDataType.document
            }
        })
    }

    async removePeriodDocument(id: string) {
        /** Удаляет документ периода */

        return this.db.get(id).then(doc => {
            return this.db.remove(doc)
        }).catch(err => {
            console.error('Error removing period document:', err)
        })
    }
}
