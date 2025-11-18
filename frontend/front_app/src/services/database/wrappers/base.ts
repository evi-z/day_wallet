import { extendRef, reactiveOmit, reactivePick, watchIgnorable } from "@vueuse/core"
import {  reactive, ref, shallowReactive, shallowRef } from "vue"
import { type InstanceOfDBWithRemoteSync } from "src/services/database/service_cls/mixins"

/** Поля метаданных, исключаемые из основных значений */
const DEFAULT_METADATA_FIELDS = ['_id', '_rev'] as const satisfies readonly (keyof PouchDB.Core.ExistingDocument<object>)[]
type MetadataFields<A extends readonly string[] = readonly []> = [...typeof DEFAULT_METADATA_FIELDS, ...A][number]
type ObjectWithoutMetadataFields<T extends object, A extends readonly string[] = readonly []> = Omit<T, MetadataFields<A>>
type ObjectMetadataFields<T extends object, A extends readonly string[] = readonly []> = Pick<T, Extract<keyof T, MetadataFields<A>>>

export type UseDatabaseDocumentRefOptions<T extends object, A extends readonly string[] = readonly []> = {
    initFn: () => Promise<T>,  /** Колбек инициализации значений из БД (должен вернуть объект сохранённого в БД документа) */
    saveFn: (val: T) => Promise<PouchDB.Core.Response>,  /** Колбек сохранения значений в БД (должен вернуть ответ от БД для обновления ревизии) */
    autoSaveToDB?: boolean,  /** Привязывать ли вотчер слежения за изменениями основных значений к сохранению в БД (Def: true) */
    additionalMetadataFields?: A  /** Дополнительные поля метаданных, исключаемые из основных значений (Def: []) */
    bindToRemote?: InstanceOfDBWithRemoteSync | undefined
}

const UseDatabaseDocumentRefDefaultOptions: Partial<UseDatabaseDocumentRefOptions<object, readonly []>> = {
    autoSaveToDB: true,
} as const

export type DatabaseDocumentRef<T extends object, A extends readonly string[] = readonly []> = {
    value: ObjectWithoutMetadataFields<T, A>
    initFromDB: () => Promise<void>
    saveToDB: () => Promise<void>
    ignoreValuesUpdates: (updater: () => void) => void
    bindValuesWatcherCallback: (callback: (values: ObjectWithoutMetadataFields<T, A>) => Promise<void>) => void
}

export const useDatabaseDocumentRef = <T extends object, A extends readonly string[] = readonly []>(options: UseDatabaseDocumentRefOptions<T, A>): DatabaseDocumentRef<T, A> => {
    options = { ...UseDatabaseDocumentRefDefaultOptions, ...options } as UseDatabaseDocumentRefOptions<T, A>
    const metadataFields = [...DEFAULT_METADATA_FIELDS, ...(options.additionalMetadataFields || [])] as const

    const valueRef = ref<ObjectWithoutMetadataFields<T, A>>({} as ObjectWithoutMetadataFields<T, A>)
    const metadata = shallowRef<ObjectMetadataFields<T, A>>({} as ObjectMetadataFields<T, A>)

    // Колбек вызова вотчера слежения за изменениями основных значений (привязывается снаружи после инициализации)
    let valuesWatcherCallback: (DatabaseDocumentRef<T, A>['bindValuesWatcherCallback']) | null = null
    const bindValuesWatcherCallback = (callback: DatabaseDocumentRef<T, A>['bindValuesWatcherCallback']) => {
        valuesWatcherCallback = callback
    }

    /** Вотчер слежения за изменениями основных значений (инициализируется при bindSaveToDBWatcher = true) */
    const { ignoreUpdates: ignoreValuesUpdates } = watchIgnorable(
        valueRef,
        async () => {
            if (valuesWatcherCallback) await valuesWatcherCallback(valueRef.value)
            if (options.autoSaveToDB) await saveToDB()
        },
        { deep: true }
    )

    const silentUpdateValues = (values: ObjectWithoutMetadataFields<T, A>) => {
        /** Обновляет значения без вызова коллбэка слежения за изменениями и сохранения в БД */

        ignoreValuesUpdates(() => {
            valueRef.value = { ...reactiveOmit(values, ...metadataFields as any) } as ObjectWithoutMetadataFields<T, A>
        })

        metadata.value = { ...reactivePick(values, ...metadataFields as any) } as ObjectMetadataFields<T, A>
    }

    const initFromDB = async () => {
        const values = shallowReactive(await options.initFn())  // Вызываем колбек инициализации значений из БД и делаем их реактивными

        silentUpdateValues(values)

        if (options.bindToRemote) {
            options.bindToRemote.addRemoteDBChangeListener(metadata.value._id, (doc) => {
                console.log('Remote DB change for document:', metadata.value._id, doc)
                silentUpdateValues(doc as ObjectWithoutMetadataFields<T, A>)
            })
        }
    }

    const saveToDB = async () => {
        const response = await options.saveFn(  // Вызываем колбек сохранения значений в БД
            { ...valueRef.value, ...metadata.value } as T
        )
        metadata.value._rev = response.rev  // Обновляем ревизию в метаданных
    }

    return extendRef(valueRef, {
        initFromDB,
        saveToDB,
        ignoreValuesUpdates,
        bindValuesWatcherCallback,
    }) as any as DatabaseDocumentRef<T, A>
}
