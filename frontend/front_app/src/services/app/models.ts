import { reactive, watch } from "vue"

export const APP_MODE = {
    local: 'local',
    remote: 'remote',
} as const

export type AppModeMap = typeof APP_MODE[keyof typeof APP_MODE]

export const SYNC_STATUS = {
    local: 'local',
    connecting: 'connecting',
    syncing: 'syncing',
    synced: 'synced',
    error: 'error',
} as const

export type SyncStatusMap = typeof SYNC_STATUS[keyof typeof SYNC_STATUS]

export type AppState = {
    mode: null | AppModeMap,
    /** Состояние обмена с облаком (в локальном режиме всегда local) */
    syncStatus: SyncStatusMap,
    syncError: string | null,
}

export const useAppState = () => {
    const state = reactive<AppState>({
        mode: null,
        syncStatus: SYNC_STATUS.local,
        syncError: null,
    })

    return state
}
