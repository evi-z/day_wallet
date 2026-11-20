
import { AppUser } from 'src/models/user'
import { BaseDatabaseService } from './base'
import { AppValuesDBData, AppValuesData } from 'src/models/app'

const DATABASE_NAME = 'day-wallet-app-db'
const USER_DATA_KEY = 'auth_user'
const APP_VALUES_KEY = 'app_values'

export class AppDatabaseService extends BaseDatabaseService {
    /** База данных для пользователя */

    constructor() { super(DATABASE_NAME) }

    async getUserData() {
        /** Получает данные авторизованного пользователя */

        return this.getByIdOrNull<AppUser>(USER_DATA_KEY)
    }

    async putUserData(data: AppUser) {
        /** Сохраняет данные авторизованного пользователя */

        const currentUserDoc = await this.getByIdOrNull<AppUser>(USER_DATA_KEY)
        const newUserDoc = {
            _id: USER_DATA_KEY,
            ...(currentUserDoc || {}),
            ...data
        }

        return this.db.put(newUserDoc)
    }

    async removeUserData() {
        /** Удаляет данные авторизованного пользователя */
        return this.db.get(USER_DATA_KEY).then((doc) => {
            return this.db.remove(doc)
        })
    }

    async getAppValues() {
        /** Получает значения приложения */
        return this.getByIdOrNull<AppValuesDBData>(APP_VALUES_KEY)
    }

    async putAppValues(data: Partial<AppValuesData>) {
        /** Сохраняет значения приложения */
        const currentDoc = await this.getByIdOrNull<AppValuesDBData>(APP_VALUES_KEY)
        const newData = {
            ...(currentDoc || { lastPeriodDocument: null }),
            ...data,
            _id: APP_VALUES_KEY,
        }

        return this.db.put(newData)
    }

}
