
import { AppUser } from 'src/models/user'
import { BaseDatabaseService } from './base'

const DATABASE_NAME = 'day-wallet-app-db'
const USER_DATA_KEY = 'auth_user'

export class AppDatabaseService extends BaseDatabaseService {
    /** База данных для пользователя */

    constructor() { super(DATABASE_NAME) }

    async getUserData() {
        /** Получает данные авторизованного пользователя */

        return this.getByIdOrNull<AppUser>(USER_DATA_KEY)
    }

    async putUserData(userData: AppUser) {
        /** Сохраняет данные авторизованного пользователя */
        return this.db.put(USER_DATA_KEY, {
            _id: USER_DATA_KEY,
            ...userData
        })
    }

    async removeUserData() {
        /** Удаляет данные авторизованного пользователя */
        return this.db.get(USER_DATA_KEY).then((doc) => {
            return this.db.remove(doc)
        })
    }
}
