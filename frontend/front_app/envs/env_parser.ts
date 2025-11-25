import dotenv from "dotenv";
import path from "path";
import { envDefaults, frontendEnvKeys } from "./defaults";
import type { EnvVariables } from "../src/env.d";

const EnvByNodeEnv = {
    development: 'dev',
    production: 'prod',
} as const

/**
 * Парсер переменных окружения для фронтенда
 *
 * Порядок загрузки (последующие переопределяют предыдущие):
 * 1. Технические переменные окружения (dev/prod)
 * 2. Дефолтные значения из defaults.ts
 * 3. Корневой .env (общие переменные приложения)
 */
export default function (): EnvVariables {
    // Определяем режим (dev/prod)
    const environment = (
        process.env.QUASAR_ENVIRONMENT ||   // Переменная окружения QUASAR_ENVIRONMENT (package.json)
        EnvByNodeEnv[process.env.NODE_ENV as keyof typeof EnvByNodeEnv] ||   // Через переменную NODE_ENV
        EnvByNodeEnv.development   // По умолчанию development
    )

    // 1. Считываем технические переменные окружения (dev/prod)
    const technicalEnv = dotenv.config({ path: `envs/.env.${environment}` }).parsed || {};

    // 2. Дефолтные значения
    const envVars = { ...envDefaults };

    // Определяем корень root .env файла
    const rootPath = path.resolve(__dirname, technicalEnv.ENV_PATH || "");
    const rootEnvPath = path.join(rootPath, ".env");
    console.log(`[env_parser] Environment: ${environment}, Root Env: "${rootEnvPath}" (ENV_PATH: "${technicalEnv.ENV_PATH}")`);

    // 3. Корневой .env (общие переменные)
    const rootEnv = dotenv.config({ path: rootEnvPath }).parsed || {};

    // Объединяем все переменные (порядок важен!)
    const allEnvVars = {
        ...envVars,      // дефолты
        ...rootEnv,      // Корневой .env (общие переменные)
        ...technicalEnv,  // Технические переменные (.env.dev или .env.prod)
    };

    const viteEnvVars: Record<string, string> = {};

    // Обрабатываем только переменные из whitelist (frontendEnvKeys)
    frontendEnvKeys.forEach((key) => {
        const value = allEnvVars[key];

        if (value !== undefined) {
            // Преобразуем все значения в строки
            viteEnvVars[key] = typeof value !== "string"
                ? JSON.stringify(value)
                : value;
        }
    });

    return viteEnvVars as unknown as EnvVariables;
}
