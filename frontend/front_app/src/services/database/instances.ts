import { ref, Ref } from "vue"

export type UseDatabaseDocumentRefOptions = {
    initFn: () => Promise<void>,
    saveFn: () => Promise<void>,
    bindWatchNonDbFields: boolean,
}

export type DocumentMainValuesRef<T extends object> = {
    value: Ref<T>
    init: () => Promise<void>,
    save: () => Promise<void>
}

export const useDatableDocumentRef = <T extends object>(options: UseDatabaseDocumentRefOptions): DocumentMainValuesRef<T> => {
    const value = ref<T>({} as T)
    const init = async () => await options.initFn()
    const save = async () => await options.saveFn()

    return {
        value: value as Ref<T>,
        init,
        save
    }
}
