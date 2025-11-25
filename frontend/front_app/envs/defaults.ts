import type { EnvVariables } from "../src/env.d";

/**
 * Дефолтные значения переменных окружения
 * Эти значения будут использованы, если переменная не определена в .env файлах
 */
export const envDefaults: EnvVariables = {
    BACKEND_API_PATH: '/api/v1',
    BACKEND_DEV_HOSTNAME: '127.0.0.1',
    BACKEND_DEV_PORT: '8000',
    FRONTEND_DEV_PORT: '9876',
} as const;

/**
 * Список переменных, которые нужно экспортировать для фронтенда
 * [WARN]: Эти переменные получат префикс VITE_ и будут доступны коде
 */
export const frontendEnvKeys = Object.keys(envDefaults) as Array<keyof typeof envDefaults>;

