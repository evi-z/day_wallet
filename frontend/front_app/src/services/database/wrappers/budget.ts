import { useDatabaseDocumentRef } from './base'
import app from 'src/services/app'
import type { BudgetPeriodDBData, BudgetSettingsDBData } from 'src/models/database'
import type { BudgetCategory } from 'src/domain/budget/types'
import { createDefaultCategories } from 'src/domain/budget/defaults'

const remoteBinding = () => (app.userDb!.isSyncActive ? app.userDb! : undefined)

/** Документ периода бюджетирования с автосохранением и подпиской на облако */
export const useBudgetPeriodRef = (documentId: string) => {
    return useDatabaseDocumentRef<BudgetPeriodDBData>({
        initFn: async () => {
            const doc = await app.userDb!.getByIdOrNull<BudgetPeriodDBData>(documentId)
            if (!doc) throw new Error(`Период бюджета не найден: ${documentId}`)
            return doc
        },
        saveFn: (doc) => app.userDb!.saveBudgetPeriod(doc),
        bindToRemote: remoteBinding(),
        // Суммы и заметки меняются при каждом нажатии: пишем пачкой.
        saveDebounceMs: 500,
    })
}

/** Настройки бюджетирования: сейчас это сберегательные счета */
export const useBudgetSettingsRef = () => {
    return useDatabaseDocumentRef<BudgetSettingsDBData>({
        initFn: async () => {
            let doc = await app.userDb!.fetchBudgetSettings()
            if (!doc) {
                await app.userDb!.createBudgetSettings({ savingsAccounts: [] })
                doc = await app.userDb!.fetchBudgetSettings()
            }
            return doc!
        },
        saveFn: (doc) => app.userDb!.saveBudgetSettings(doc),
        bindToRemote: remoteBinding(),
        saveDebounceMs: 500,
    })
}

/** Шаблон статей: создаёт стартовый набор при первом использовании */
export const ensureBudgetTemplate = async (): Promise<BudgetCategory[]> => {
    const doc = await app.userDb!.fetchBudgetTemplate()
    if (doc?.categories?.length) return doc.categories

    const categories = createDefaultCategories()
    if (doc) await app.userDb!.saveBudgetTemplate({ ...doc, categories })
    else await app.userDb!.createBudgetTemplate(categories)
    return categories
}
