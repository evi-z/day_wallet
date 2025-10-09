import { AppUser } from "src/models/user"
import { AppDatabaseService } from "src/services/database/service_cls/app_db"
import { UserDatabaseService } from "src/services/database/service_cls/user_db"
import { initPouchDB } from "../database/service_cls/base"
import { APP_MODE, AppState, useAppState } from "./models"



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
            this.userDb = new UserDatabaseService(this.user?.id || null)
        } catch (error) {
            console.error('Error getting user data from DB:', error)
            throw error
        }

        this.state.mode = this.user ? APP_MODE.remote : APP_MODE.local
        console.log('🙎‍♂️ ' + (
            this.state.mode === APP_MODE.local ? 'Local user initialized' : `User initialized (id: ${this.user?.id})`
        ))
    }

    async init() {
        initPouchDB()  /** Инициализировать раньше всех BD (!) */
        this.appDb = new AppDatabaseService()
        await this._initUserAndUserDb()
    }

    async login() {
        // TODO: Login to remote server
        this.state.mode = APP_MODE.remote
    }

    async logout() {
        // TODO: Logout from remote server
        this.state.mode = APP_MODE.local
    }
}

const app = AppService.Instance
export default app
