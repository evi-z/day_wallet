import { AppUser } from "src/models/user"
import { AppDatabaseService } from "src/services/database/service_cls/app_db"
import { UserDatabaseService } from "src/services/database/service_cls/user_db"
import { initPouchDB } from "../database/service_cls/base"
import { APP_MODE, AppState, SYNC_STATUS, useAppState } from "./models"
import api from "src/api"
import PouchDB from 'pouchdb'

class AppService {
    public static _instance?: AppService
    appDb?: AppDatabaseService

    user: AppUser | null = null
    userDb?: UserDatabaseService
    private _localDb?: UserDatabaseService

    state: AppState

    private constructor() {
        this.state = useAppState()
    }

    public static get Instance() {
        return this._instance || (this._instance = new this())
    }

    private async _initUserAndUserDb() {
        /** Инициализирует пользователя и его БД */

        // Не оставляем синхронизацию предыдущей учётки работать после смены пользователя
        this.userDb?.stopSyncWithRemote()

        try {
            this.user = await this.appDb!.getUserData() // UserInfo OR null (if local)
            this.userDb = new UserDatabaseService(this.user?.db_name || null)
        } catch (error) {
            console.error('Error getting user data from DB:', error)
            throw error
        }

        this.state.mode = this.user ? APP_MODE.remote : APP_MODE.local
        this.state.syncStatus = this.user ? SYNC_STATUS.connecting : SYNC_STATUS.local
        this.state.syncError = null
        console.log('🙎‍♂️ ' + (
            this.state.mode === APP_MODE.local ? 'Local user initialized' : `User initialized (${this.user?.email})`
        ))

        if (this.state.mode === APP_MODE.remote) {
            await this._initRemoteUserDB()
        }
    }

    private async _initRemoteUserDB() {
        try {
            const userInfo = await api.auth.fetchUserInfo()

            // Создаём подключение к удалённой БД
            // В dev режиме используется proxy (/db -> localhost:5984)
            // В production используется абсолютный URL из env переменных
            //
            // ВАЖНО: PouchDB считает удалённой только БД с абсолютным URL.
            // Относительный путь вида /db/<name> он трактует как имя локальной
            // IndexedDB, из-за чего синхронизация шла «сама с собой» и в облако
            // не уходило ничего.
            const remoteDBUrl = new URL(`/db/${this.user!.db_name}`, window.location.origin).toString()
            const remoteDB = new PouchDB(remoteDBUrl, {
                skip_setup: true,
                auth: {
                    username: userInfo.db_username,
                    password: userInfo.db_password
                },
                // Явно отключаем credentials (cookies) для cross-origin запросов
                // т.к. используем Basic Auth через заголовок Authorization
                fetch: function (url, opts) {
                    opts = opts || {}
                    opts.credentials = 'omit' // Отключаем cookies для CORS с origins = *
                    return PouchDB.fetch(url, opts)
                }
            })

            // Выполняем аутентификацию
            // const loginResult = await remoteDB.logIn(userInfo.db_username, userInfo.db_password)
            // console.log('Remote DB logged in:', loginResult)

            // Запускаем синхронизацию
            await this.userDb!.initSyncWithRemote(remoteDB, {
                onStatus: (status, detail) => {
                    this.state.syncStatus = status
                    this.state.syncError = status === SYNC_STATUS.error
                        ? this._formatSyncError(detail)
                        : null
                }
            })

        } catch (error) {
            console.error('Error in remote DB initialization:', error)
            this.state.syncStatus = SYNC_STATUS.error
            this.state.syncError = this._formatSyncError(error)
        }
    }

    private _formatSyncError(error: unknown): string {
        if (error instanceof Error) return error.message
        if (typeof error === 'string') return error
        if (error && typeof error === 'object') {
            const maybe = error as { message?: string, reason?: string, status?: number }
            return maybe.message || maybe.reason || (maybe.status ? `HTTP ${maybe.status}` : 'Ошибка синхронизации')
        }
        return 'Ошибка синхронизации'
    }

    async init() {
        initPouchDB()  /** Инициализировать раньше всех BD (!) */
        this.appDb = new AppDatabaseService()
        await this._initUserAndUserDb()
    }

    async login(data: AppUser) {
        await this.appDb!.putUserData(data)
        await this._initUserAndUserDb()
        this.state.mode = this.user ? APP_MODE.remote : APP_MODE.local
    }

    async logout() {
        this.userDb?.stopSyncWithRemote()
        await this.appDb!.removeUserData()
        this.user = null
        this.userDb = new UserDatabaseService(null)
        this.state.mode = APP_MODE.local
        this.state.syncStatus = SYNC_STATUS.local
        this.state.syncError = null
    }

    /** Локальная БД оффлайн-режима (не зависит от текущего аккаунта) */
    private localDb() {
        return this._localDb || (this._localDb = new UserDatabaseService(null))
    }

    /** Сколько периодов лежит только в оффлайн-режиме */
    async getLocalPeriodsCount(): Promise<number> {
        const docs = await this.localDb().fetchPeriodDocuments()
        return docs.length
    }

    /** Нужно ли предложить перенос локальных периодов в текущий аккаунт */
    async shouldOfferLocalImport(): Promise<boolean> {
        if (!this.user || this.state.mode !== APP_MODE.remote) return false

        const appValues = await this.appDb!.getAppValues()
        if (appValues?.localImportTarget === this.user.db_name) return false

        return (await this.getLocalPeriodsCount()) > 0
    }

    /**
     * Переносит периоды из оффлайн-режима в БД аккаунта.
     * Документы копируются как есть (id — UUID, совпадений практически нет),
     * после чего live sync отправит их в облако.
     */
    async importLocalPeriods(): Promise<number> {
        if (!this.user) throw new Error('Нет активного пользователя')

        const localDb = this.localDb()
        const count = (await localDb.fetchPeriodDocuments()).length
        if (count > 0) {
            const { rows } = await localDb.db.allDocs({ include_docs: true })
            const docs = rows
                .map(row => row.doc)
                .filter((doc): doc is PouchDB.Core.ExistingDocument<object> => {
                    return !!doc && !doc._id.startsWith('_') && !doc._deleted
                })
                .map(doc => {
                    // Копируем содержимое без ревизии: конфликт с уже существующим
                    // документом не должен перезаписывать данные аккаунта.
                    const copy = { ...doc } as Record<string, unknown>
                    delete copy._rev
                    return copy
                })

            await this.userDb!.db.bulkDocs(docs)
        }

        await this.appDb!.putAppValues({ localImportTarget: this.user.db_name })
        return count
    }

    /** Пользователь отказался переносить локальные периоды в этот аккаунт */
    async dismissLocalImport() {
        if (!this.user) return
        await this.appDb!.putAppValues({ localImportTarget: this.user.db_name })
    }
}

const app = AppService.Instance
export default app
