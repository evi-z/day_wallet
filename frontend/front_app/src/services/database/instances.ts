import { extendRef, IgnoredUpdater, reactiveOmit, reactivePick, watchIgnorable } from "@vueuse/core"
import { PeriodDocumentDBData, PeriodDocumentMainValuesData, PeriodDocumentMainValuesDBData } from "src/models/database";
import { ref, Ref, shallowRef } from "vue"
import app from "../app";
import { DefaultPeriodDocumentMainValues } from "src/pages/IndexPage/PeriodDocumentBody/models";

const DEFAULT_EXCLUDED_FIELDS = ['_id', '_rev'] as const
type DefaultExcludedKeys = typeof DEFAULT_EXCLUDED_FIELDS
type ExcludedKeys<A extends string[]> = DefaultExcludedKeys[number] | A[number];
type DatabaseDocumentRefValue<T extends object, A extends string[] = []> = Omit<T, ExcludedKeys<A>>

export type UseDatabaseDocumentRefOptions<T extends object, A extends string[] = []> = {
    initFn: () => Promise<T>,
    saveFn: (val: T) => Promise<void>,
    additionalExcludedFields?: A,  // Дополнительные поля для исключения из значения
}

export type DocumentValuesRef<T extends object, A extends string[] = []> = {
    value: DatabaseDocumentRefValue<T, A>
    init: () => Promise<void>
    save: () => Promise<void>
    ignoreUpdates: IgnoredUpdater,
}

export const useDatabaseDocumentRef = <T extends object, A extends string[] = []>(options: UseDatabaseDocumentRefOptions<T, A>) => {
    const metadataFields = [...DEFAULT_EXCLUDED_FIELDS, ...(options.additionalExcludedFields || [])]
    const valuesRef = ref<DatabaseDocumentRefValue<T, A>>({} as DatabaseDocumentRefValue<T, A>)
    const metadata = shallowRef({})
    const { ignoreUpdates: ignoreValuesUpdates } = watchIgnorable(valuesRef,
        async (val) => await save(),
        { deep: true }
    )

    const init = async () => {
        const res = await options.initFn()
        ignoreValuesUpdates(() => {
            valuesRef.value = { ...reactiveOmit(res, ...metadataFields as (keyof T)[]) as DatabaseDocumentRefValue<T, A> }
        })

        metadata.value = { ...reactivePick(res, ...metadataFields as (keyof T)[]) }
    }
    const save = async () => await options.saveFn(valuesRef.value)

    return extendRef(valuesRef, {
        init,
        save,
        ignoreUpdates: ignoreValuesUpdates
    })
}

type ExcludedRelationDocumentFieldsT = Extract<keyof PeriodDocumentMainValuesDBData, 'document_id' | 'type'>
const ExcludedRelationDocumentFields: ExcludedRelationDocumentFieldsT[] = ['document_id', 'type'] as const

export const useDocumentMainValuesRef = (document: PeriodDocumentDBData) => {
    return useDatabaseDocumentRef<PeriodDocumentMainValuesDBData, ExcludedRelationDocumentFieldsT[]>({
        initFn: async () => {
            let values = await app.userDb!.fetchPeriodDocumentMainValues(document._id)
            if (!values) {  // Если нет основных значений, то создаём дефолтные
                await app.userDb!.setPeriodDocumentMainValues(document._id, DefaultPeriodDocumentMainValues).then(async res => {
                    values = await app.userDb!.fetchPeriodDocumentMainValues(document._id)!
                })
            }

            return values!
        },
        saveFn: async (val) => {
            console.log('Call save', val)
        },
        additionalExcludedFields: ExcludedRelationDocumentFields
    })
}