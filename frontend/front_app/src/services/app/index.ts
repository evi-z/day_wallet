import { AppUser } from "src/models/user"
import { AppDatabaseService } from "src/services/database/service_cls/app_db"
import { UserDatabaseService } from "src/services/database/service_cls/user_db"
import { initPouchDB } from "../database/service_cls/base"
import { APP_MODE, AppState, useAppState } from "./models"
import api from "src/api"
import PouchDB from 'pouchdb'

class AppService {
    public static _instance?: AppService
    appDb?: AppDatabaseService

    user: AppUser | null = null
    userDb?: UserDatabaseService

    state: AppState

    private constructor() {
        this.state = useAppState()
    }

    public static get Instance() {
        return this._instance || (this._instance = new this())
    }

    private async _initUserAndUserDb() {
        /** Инициализирует пользователя и его БД */

        try {
            this.user = await this.appDb!.getUserData() // UserInfo OR null (if local)
            this.userDb = new UserDatabaseService(this.user?.db_name || null)
        } catch (error) {
            console.error('Error getting user data from DB:', error)
            throw error
        }

        this.state.mode = this.user ? APP_MODE.remote : APP_MODE.local
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
            console.log('User info:', userInfo, this.user?.db_name)

            // Создаём подключение к удалённой БД
            const remoteDB = new PouchDB(
                `http://127.0.0.1:5984/${this.user!.db_name}`, 
                { 
                    skip_setup: true,
                    fetch: function (url, opts) {
                        opts = opts || {}
                        opts.credentials = 'include' // Включаем cookies в запросы
                        return PouchDB.fetch(url, opts)
                    }
                },
            )

            // Проверяем сессию ДО аутентификации
            const sessionBefore = await remoteDB.getSession()
            console.log('Session BEFORE login:', sessionBefore)

            // Выполняем аутентификацию
            const loginResult = await remoteDB.logIn(userInfo.db_username, userInfo.db_password)
            console.log('Remote DB logged in:', loginResult)

            // Добавляем небольшую задержку
            await new Promise(resolve => setTimeout(resolve, 100))

            // Проверяем сессию ПОСЛЕ аутентификации
            const sessionAfter = await remoteDB.getSession()
            console.log('Session AFTER login:', sessionAfter)

            if (sessionAfter.userCtx.name !== userInfo.db_username) {
                throw new Error(`Session verification failed - expected: ${userInfo.db_username}, got: ${sessionAfter.userCtx.name}`)
            }

            // Только после успешной аутентификации запускаем синхронизацию
            await this.userDb!.syncWithRemoteDB(remoteDB)
            console.log('Remote DB sync started successfully')

        } catch (error) {
            console.error('Error in remote DB initialization:', error)
            throw error
        }
    }

    async init() {
        initPouchDB()  /** Инициализировать раньше всех BD (!) */
        this.appDb = new AppDatabaseService()
        await this._initUserAndUserDb()
    }

    async login(data: AppUser) {
        await this.appDb!.putUserData(data)
        await this._initUserAndUserDb()
        this.state.mode = APP_MODE.remote
    }

    async logout() {
        await this.appDb!.removeUserData()
        this.state.mode = APP_MODE.local
    }
}

const app = AppService.Instance
export default app
