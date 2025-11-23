/**
 * Дефолтные значения переменных окружения
 * Эти значения будут использованы, если переменная не определена в .env файлах
 */
export const envDefaults = {
    // Backend
    BACKEND_HOST: 'localhost',
    BACKEND_PORT: '8000',
    BACKEND_PROTOCOL: 'http',

    // Frontend
    FRONTEND_DEV_PORT: '9876',

    // CouchDB
    COUCHDB_HOST: 'localhost',
    COUCHDB_PORT: '5984',
    COUCHDB_PROTOCOL: 'http',
} as const;

/**
 * Список переменных, которые нужно экспортировать для фронтенда
 * [WARN]: Эти переменные получат префикс VITE_ и будут доступны коде
 */
export const frontendEnvKeys = Object.keys(envDefaults) as Array<keyof typeof envDefaults>;

export type EnvVariables = typeof envDefaults;

