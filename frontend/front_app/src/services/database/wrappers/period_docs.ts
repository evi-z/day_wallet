import { BasePeriodDocumentRelationDocument, PeriodDocumentCalendarFactValuesDBData, PeriodDocumentDBData, PeriodDocumentMainValuesDBData } from "src/models/database"
import { useDatabaseDocumentRef } from "./base"
import app from "src/services/app"
import { DefaultPeriodDocumentMainValues } from "src/pages/IndexPage/PeriodDocumentBody/models"


const PERIOD_DOC_RELATION_METADATA_FIELDS = ['document_id', 'type'] as const satisfies readonly (keyof BasePeriodDocumentRelationDocument)[]
type PeriodDocRelationMetadataFields = typeof PERIOD_DOC_RELATION_METADATA_FIELDS

/** Используется для слежения за основными значениями документа */
export const useDocumentMainValuesRef = (document: PeriodDocumentDBData) => {
    const bindToRemote = app.userDb!.isSyncActive ? app.userDb! : undefined
    return useDatabaseDocumentRef<PeriodDocumentMainValuesDBData, PeriodDocRelationMetadataFields>({
        initFn: async () => {
            let values = await app.userDb!.fetchPeriodDocumentMainValues(document._id)
            if (!values) {  // Если нет основных значений, то создаём их
                await app.userDb!.setPeriodDocumentMainValues(document._id, DefaultPeriodDocumentMainValues).then(async res => {
                    values = await app.userDb!.getByIdOrNull<PeriodDocumentMainValuesDBData>(res.id)
                })
            }

            return values!
        },
        saveFn: async (values) => {
            return app.userDb!.setPeriodDocumentMainValues(document._id, values)
        },
        additionalMetadataFields: PERIOD_DOC_RELATION_METADATA_FIELDS,
        bindToRemote: app.userDb!
    })
}

/** Используется для слежения за значениями фактов календаря */
export const useDocumentCalendarFactValuesRef = (document: PeriodDocumentDBData) => {
    const bindToRemote = app.userDb!.isSyncActive ? app.userDb! : undefined
    return useDatabaseDocumentRef<PeriodDocumentCalendarFactValuesDBData, PeriodDocRelationMetadataFields>({
        initFn: async () => {
            let values = await app.userDb!.fetchPeriodDocumentCalendarFactValues(document._id)

            if (!values) {  // Если нет значений фактов календаря, то создаём их (пустыми, для инициализации id в БД)
                await app.userDb!.setPeriodDocumentCalendarFactValues(document._id, {}).then(async res => {
                    values = await app.userDb!.getByIdOrNull<PeriodDocumentCalendarFactValuesDBData>(res.id)
                })
            }

            return values!
        },
        saveFn: async (values) => {
            return app.userDb!.setPeriodDocumentCalendarFactValues(document._id, values)
        },
        additionalMetadataFields: PERIOD_DOC_RELATION_METADATA_FIELDS,
        bindToRemote: bindToRemote
    })
}
