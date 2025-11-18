/** Кэшированные значения приложения */
export type AppValuesData = {
    lastPeriodDocument: string | null
}

export type AppValuesDBData = PouchDB.Core.ExistingDocument<AppValuesData>
