import { extendRef, watchIgnorable } from "@vueuse/core"
import { ref, shallowRef } from "vue"
import { type InstanceOfDBWithRemoteSync } from "src/services/database/service_cls/mixins"
import { omitObject, pickObject } from "src/utils/js-utils"



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

type ValuesWatcherCallback<T extends object, A extends readonly string[] = readonly []> = (values: ObjectWithoutMetadataFields<T, A>) => Promise<void>

export type DatabaseDocumentRef<T extends object, A extends readonly string[] = readonly []> = {
    value: ObjectWithoutMetadataFields<T, A>
    initFromDB: () => Promise<void>
    saveToDB: () => Promise<void>
    ignoreValuesUpdates: (updater: () => void) => void
    bindValuesWatcher: (callback: ValuesWatcherCallback<T, A>) => void
    unbindValuesWatcher: (callback: ValuesWatcherCallback<T, A>) => void
}

export const useDatabaseDocumentRef = <T extends object, A extends readonly string[] = readonly []>(options: UseDatabaseDocumentRefOptions<T, A>): DatabaseDocumentRef<T, A> => {
    options = { ...UseDatabaseDocumentRefDefaultOptions, ...options } as UseDatabaseDocumentRefOptions<T, A>
    const metadataFields = [...DEFAULT_METADATA_FIELDS, ...(options.additionalMetadataFields || [])] as const

    const valueRef = ref<ObjectWithoutMetadataFields<T, A>>({} as ObjectWithoutMetadataFields<T, A>)
    const metadata = shallowRef<ObjectMetadataFields<T, A>>({} as ObjectMetadataFields<T, A>)

    // Работа с коллбэками слежения за изменениями значений (привязываются снаружи после инициализации)
    const valuesWatchers = <ValuesWatcherCallback<T, A>[]>([] as ValuesWatcherCallback<T, A>[])
    const bindValuesWatcher = (callback: ValuesWatcherCallback<T, A>) => {
        if (valuesWatchers.includes(callback)) return  // Если коллбэк уже привязан, то не привязываем его снова
        valuesWatchers.push(callback)
    }

    const unbindValuesWatcher = (callback: ValuesWatcherCallback<T, A>) => {
        const index = valuesWatchers.indexOf(callback)
        if (index === -1) {
            console.warn('Values watcher not found:', callback)
            return
        }
        valuesWatchers.splice(index, 1)
    }

    const callValuesWatchers = async () => {
        for (const watcher of valuesWatchers) {
            try {
                await watcher(valueRef.value)
            } catch (error) {
                console.error('Error calling values watcher:', error)
            }
        }
    }

    /** Вотчер слежения за изменениями основных значений (инициализируется при bindSaveToDBWatcher = true) */
    const { ignoreUpdates: ignoreValuesUpdate } = watchIgnorable(
        valueRef,
        async () => {
            if (options.autoSaveToDB) await saveToDB()
            await callValuesWatchers()
        },
        { deep: true }
    )

    const updateFromDocValues = (values: T) => {
        /** Обновляет значения из документа  */

        ignoreValuesUpdate(() => {
            valueRef.value = omitObject(values, ...metadataFields as any) as ObjectWithoutMetadataFields<T, A>
        })

        metadata.value = pickObject(values, ...metadataFields as any) as ObjectMetadataFields<T, A>
    }

    const initFromDB = async () => {
        const values = await options.initFn()  // Вызываем колбек инициализации значений из БД

        updateFromDocValues(values)

        if (options.bindToRemote) {
            /** Привязываем коллбэк на изменение документа в удалённой БД (pull) */
            options.bindToRemote.addRemoteDBChangeListener(metadata.value._id, async (doc) => {
                console.log('Remote DB change for document:', metadata.value._id, doc)
                updateFromDocValues(doc as T)  // Обновляем значения для ref-ов (в БД уже сохранены новые значения)
                // Вызываем коллбэк на изменение значений (если привязан)
                await callValuesWatchers()
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
        ignoreValuesUpdates: ignoreValuesUpdate,
        bindValuesWatcher,
        unbindValuesWatcher,
    }) as any as DatabaseDocumentRef<T, A>
}
