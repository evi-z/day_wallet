/** Кэшированные значения приложения */
export type AppValuesData = {
    lastPeriodDocument: string | null
    /** Аккаунт, в который уже предлагали/выполнили перенос локальных периодов */
    localImportTarget?: string | null
}

export type AppValuesDBData = PouchDB.Core.ExistingDocument<AppValuesData>
