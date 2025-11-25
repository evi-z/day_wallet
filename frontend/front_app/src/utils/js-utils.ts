/** Утилиты для работы с объектами */
export const omitObject = <T extends object, K extends keyof T>(
    obj: T,
    ...keys: K[]
): Omit<T, K> => {
    const result = { ...obj }
    keys.forEach(key => delete result[key])
    return result
}

export const pickObject = <T extends object, K extends keyof T>(
    obj: T,
    ...keys: K[]
): Pick<T, K> => {
    const result = {} as Pick<T, K>
    keys.forEach(key => {
        if (key in obj) result[key] = obj[key]
    })
    return result
}

export const downloadBlobFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
}