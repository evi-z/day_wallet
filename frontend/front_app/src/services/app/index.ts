import { AppUser } from "src/models/user"
import { AppDatabaseService } from "../database/app_db"
import { UserDatabaseService } from "../database/user_db"
import { initPouchDB } from "../database/base"

class AppService {
    public static _instance?: AppService
    appDb?: AppDatabaseService

    user: AppUser | null = null
    userDb?: UserDatabaseService

    private constructor() {}

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

        console.log('🙎‍♂️ ' + (
            this.isLocalUser ? 'Local user initialized' : `User initialized (id: ${this.user?.id})`
        ))
    }

    async init() {
        initPouchDB()  /** Инициализировать раньше всех BD (!) */
        this.appDb = new AppDatabaseService()
        await this._initUserAndUserDb()
    }

    get isLocalUser() {
        return this.user === null
    }
}

const app = AppService.Instance
export default app
