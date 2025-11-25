import type { EnvVariables } from '@/env.d'

/** Переменные конфигурации */
export interface IConfig extends EnvVariables {
    /** Custom variables for the application */
}


export const config: IConfig = {
    /** Quasar variables */
    DEV: process.env.DEV!,
    PROD: process.env.PROD!,
    MODE: process.env.MODE!,  // spa, pwa, ...

    /** Environment variables */
    BACKEND_API_PATH: process.env.BACKEND_API_PATH!,
    FRONTEND_DEV_PORT: process.env.FRONTEND_DEV_PORT!,
} as const;
