import { AppValuesData, AppValuesDBData } from "src/models/app"
import { useDatabaseDocumentRef } from "./base"
import app from "src/services/app"

const DefaultAppValues: AppValuesData = {
    lastPeriodDocument: null,
} as const

export const useAppValuesRef = () => {
    return useDatabaseDocumentRef<AppValuesDBData>({
        initFn: async () => {
            let values = await app.appDb!.getAppValues()
            if (!values) {
                await app.appDb!.putAppValues(DefaultAppValues)
                values = await app.appDb!.getAppValues()
            }
            return values!
        },
        saveFn: async (values: AppValuesData) => {
            return await app.appDb!.putAppValues(values)
        }
    })
}
