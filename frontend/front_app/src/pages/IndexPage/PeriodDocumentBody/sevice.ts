import { PeriodDocumentDBData, PeriodDocumentMainValuesDBData } from "src/models/database"
import app from "src/services/app"
import { reactive, Ref, ref, toRefs, watch } from "vue"
import { DefaultPeriodDocumentMainValues } from "./models"
import { extendRef, reactify, reactivePick, toReactive } from "@vueuse/core"

type DocumentMainValuesRef = {
    value: PeriodDocumentMainValuesDBData
    init: () => Promise<void>
    save: () => Promise<void>
}

export const useDocumentMainValuesRef = (document: PeriodDocumentDBData): DocumentMainValuesRef => {
    const init = async () => {
        let mainValues = await app.userDb!.fetchPeriodDocumentMainValues(document._id)
        if (!mainValues) {  // Если нет основных значений, то создаём их
            await app.userDb!.setPeriodDocumentMainValues(document._id, DefaultPeriodDocumentMainValues).then(async res => {
                mainValues = await app.userDb!.getByIdOrNull<PeriodDocumentMainValuesDBData>(res.id)
            })
        }
        valuesRef.value = mainValues!

        // const { _id, _rev, ...rest } = toRefs(valuesRef.value)
        const rest = reactivePick(toReactive(valuesRef), (val, key) => key !== '_id' && key !== '_rev')
        console.log('REST', rest)

        watch(
            () => rest,
            async (val) => {
                console.log('WATCH Main Values', val)
            },
            { deep: true }
        )
    }

    const save = async () => {
        console.log('Call save')
    }

    const valuesRef = ref<PeriodDocumentMainValuesDBData>({} as PeriodDocumentMainValuesDBData)

    return extendRef(valuesRef, {
        init,
        save
    })
}
