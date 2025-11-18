import { reactive, watch } from "vue"

export const APP_MODE = {
    local: 'local',
    remote: 'remote',
} as const

export type AppModeMap = typeof APP_MODE[keyof typeof APP_MODE]

export type AppState = {
    mode: null | AppModeMap,
}

export const useAppState = () => {
    const state = reactive<AppState>({
        mode: null,
    })

    return state
}
