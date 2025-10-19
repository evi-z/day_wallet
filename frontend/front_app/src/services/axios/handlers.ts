
import { AxiosError } from "axios";
import { Notify } from "quasar";

export function handleResponseError(err: AxiosError) {
    return Notify.create({
        type: "negative",
        message: `Ошибка: ${err.message}`,
        position: "top",
    })
}
