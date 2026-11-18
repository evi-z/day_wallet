import app from 'src/services/app'
import { downloadBlobFile } from 'src/utils/js-utils'

type ImportedDoc = { _id: string, _rev?: string, type?: string, [key: string]: unknown }

/** Выгружает все документы текущей пользовательской БД в JSON-файл */
export const exportUserData = async () => {
    if (!app.userDb) throw new Error('База данных не инициализирована')

    const res = await app.userDb.db.allDocs({ include_docs: true })
    const docs = res.rows.map(row => row.doc).filter(Boolean)
    const json = JSON.stringify({ docs }, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })

    downloadBlobFile(blob, `day_wallet_export_${new Date().toISOString().split('T')[0]}.json`)
}

/**
 * Загружает экспорт Day Wallet в текущую БД.
 * Документы обновляются по _id; служебные _design-документы пропускаются.
 * Возвращает количество загруженных документов.
 */
export const importUserData = async (file: File): Promise<number> => {
    if (!app.userDb) throw new Error('База данных не инициализирована')

    const parsed = JSON.parse(await file.text()) as { docs?: ImportedDoc[] }
    const docs = (parsed.docs || []).filter(doc => doc?._id && !doc._id.startsWith('_'))
    if (!docs.length) throw new Error('В файле нет документов Day Wallet')

    const db = app.userDb.db
    const existing = await db.allDocs({ keys: docs.map(doc => doc._id), include_docs: false })
    const revById = new Map<string, string>()
    for (const row of existing.rows as Array<{ id: string, value?: { rev: string } }>) {
        if (row.value?.rev) revById.set(row.id, row.value.rev)
    }

    const toSave = docs.map(doc => {
        const copy = { ...doc }
        const rev = revById.get(doc._id)
        if (rev) copy._rev = rev
        else delete copy._rev
        return copy
    })

    const results = await db.bulkDocs(toSave)
    const failed = results.filter(result => 'error' in result).length
    if (failed) throw new Error(`Не удалось загрузить документов: ${failed}`)

    return toSave.length
}
