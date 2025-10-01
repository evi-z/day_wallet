import PouchDB from 'pouchdb'
import PouchDBFind from 'pouchdb-find'

export const initPouchDB = () => {
    PouchDB.plugin(PouchDBFind)
}

export class BaseDatabaseService {
    /** Базовый класс для работы с БД */

    protected db: PouchDB.Database

    constructor(key: string) {
        this.db = new PouchDB(key)
    }

    async getOrNull(key: string) {
        /**
         * Получает данные по ключу или null если нет в БД
         * Возвращает ошибку, если catch status != 404
         * */

        return this.db.get(key).then((doc) => {
            return doc
        }).catch((error) => {
            if (error.status === 404) return null
            throw error
        })
    }

    async find<T extends any>(...args: Parameters<PouchDB.Database['find']>): Promise<T[]> {
        return this.db.find(...args).then((res) => {
            if (res.warning) console.warn('🔍 PouchDB find warning:', res.warning)
            return res.docs as T[]
        })
    }
}
