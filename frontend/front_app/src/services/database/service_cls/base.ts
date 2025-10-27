import PouchDB from 'pouchdb'
import PouchDBFind from 'pouchdb-find'
import PouchDBAuthentication from 'pouchdb-authentication'

export const initPouchDB = () => {
    PouchDB.plugin(PouchDBFind)
    PouchDB.plugin(PouchDBAuthentication)
}

export class BaseDatabaseService {
    /** Базовый класс для работы с БД */

    protected db: PouchDB.Database

    constructor(key: string) {
        this.db = new PouchDB(key)
    }

    async getByIdOrNull<T extends object>(id: string): Promise<T | null> {
        /**
         * Получает данные по ключу или null если нет в БД
         * Возвращает ошибку, если catch status != 404
         * */

        return this.db.get(id).then((doc) => {
            return doc as T
        }).catch((error) => {
            if (error.status === 404) return null
            throw error
        })
    }

    async _createDocument<D extends object>(data: D) {
        /** Добавляет новый документ в БД */

        return this.db.post(data)
    }

    async _createAuditDocument<D extends object>(data: D) {
        /** Добавляет новый документ в БД с датами создания и обновления */

        return this._createDocument({
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
    }

    async _find<T extends object>(...args: Parameters<PouchDB.Database['find']>): Promise<PouchDB.Core.ExistingDocument<T>[]> {
        /**
         * Получает все документы из результатов поиска (либо пустой массив, если нет документов)
         * */

        return this.db.find(...args).then((res) => {
            if (res.warning) console.warn('🔍 PouchDB find warning:', res.warning)
            return res.docs as PouchDB.Core.ExistingDocument<T>[]
        })
    }

    async _findOneOrNull<T extends object>(...args: Parameters<PouchDB.Database['find']>) {
        /**
         * Получает первый документ из результатов поиска
         * Возвращает null, если нет документов
         * */

        return this._find<T>(...args).then((res) => {
            return res[0] || null
        })
    }

    async removeDocumentById(id: string) {
        /**
         * Удаляет документ из БД по id
         * */

        return this.db.get(id).then(doc => {
            return this.db.remove(doc)
        }).catch(err => {
            console.error(`Error removing document with id "${id}":`, err)
        })
    }

    async _removeDocumentsByFind(...args: Parameters<PouchDB.Database['find']>): Promise<void> {
        /**
         * Удаляет документы из БД по результату поиска
         * */

        return this._find(...args).then(async docs => {
            if (!docs.length) return
            await this.db.bulkDocs(docs.map(doc => ({ _id: doc._id, _rev: doc._rev, _deleted: true })))
        }).catch(err => {
            console.error(`Error removing documents by find:`, err)
        })
    }
}

export class BaseTypeDatabaseService<T extends string> extends BaseDatabaseService {
    /** Базовый класс для работы с БД с типовыми документами */

    constructor(key: string) {
        super(key)
        this.db.createIndex({
            index: {
                fields: ['type']
            }
        })
    }

    async _createTypeDocument<D extends object>(type: T, data: D) {
        /** Добавляет новый документ в БД */

        return this._createDocument({
            type,
            ...data,
        })
    }

    async _createAuditTypeDocument<D extends object>(type: T, data: D) {
        /** Добавляет новый документ в БД с датами создания и обновления */

        return this._createAuditDocument({ type, ...data })
    }

    async _updateTypeDocument<D extends object>(exDoc: PouchDB.Core.ExistingDocument<D>, type: T, data: D) {
        /** Обновляет документ в БД */

        return this.db.put<D>({
            _id: exDoc._id,
            _rev: exDoc._rev,
            type: type,
            ...data, // Обновляем переданными данными
        })
    }

    async _createOrUpdateTypeDocument<D extends object>(
        exDoc: PouchDB.Core.ExistingDocument<D> | undefined | null, type: T, data: D
    ) {
        /** Создаёт или обновляет документ в БД */

        if (exDoc) return this._updateTypeDocument(exDoc, type, data)
        return this._createTypeDocument(type, data)
    }

    async _findByType<T extends object>(type: string): Promise<PouchDB.Core.ExistingDocument<T>[]> {
        /**
         * Получает все документы из результатов поиска по типу
         * */

        return this._find<T>({ selector: { type } })
    }
}
