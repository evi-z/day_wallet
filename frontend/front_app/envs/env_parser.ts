import dotenv from "dotenv";
import path from "path";
import { envDefaults, frontendEnvKeys } from "./defaults";

// Путь к корню монорепо (2 уровня вверх от front_app)
const monorepoRoot = path.resolve(__dirname, "../../../");

/**
 * Парсер переменных окружения для фронтенда
 *
 * Порядок загрузки (последующие переопределяют предыдущие):
 * 1. Дефолтные значения из defaults.ts
 * 2. Корневой .env (общие переменные для всего монорепо)
 * 3. .env.dev или .env.prod (переменные для окружения)
 *
 * Автоматически добавляет префикс VITE_ к переменным (ограничение Vite)
 * @returns Объект с переменными окружения для build.env
 */
export default function (): ImportMetaEnv {
    // Определяем режим (dev/prod)
    const environment = process.env.QUASAR_ENVIRONMENT || 'dev';
    const isProduction = environment === 'prod';

    // 1. Дефолтные значения
    const envVars = { ...envDefaults };

    // 2. Корневой .env (общие переменные)
    const rootEnv = dotenv.config({
        path: path.join(monorepoRoot, ".env")
    }).parsed || {};

    // 3. Переменные для окружения (dev/prod)
    const envSpecific = dotenv.config({
        path: path.join(monorepoRoot, `.env.${environment}`)
    }).parsed || {};

    // Объединяем все переменные (порядок важен!)
    const allEnvVars = {
        ...envVars,      // дефолты
        ...rootEnv,      // корневой .env
        ...envSpecific,  // .env.dev или .env.prod
    };

    const viteEnvVars: Record<string, string> = {};

    // Обрабатываем только переменные из whitelist (frontendEnvKeys)
    frontendEnvKeys.forEach((key) => {
        const value = allEnvVars[key];

        if (value !== undefined) {
            // Добавляем префикс VITE_ к ключу
            const viteKey = `VITE_${key}`;

            // Преобразуем все значения в строки
            viteEnvVars[viteKey] = typeof value !== "string"
                ? JSON.stringify(value)
                : value;
        }
    });

    // Мета-переменные
    viteEnvVars.VITE_APP_ENV = environment;
    viteEnvVars.VITE_IS_PRODUCTION = String(isProduction);

    return viteEnvVars as unknown as ImportMetaEnv;
}
