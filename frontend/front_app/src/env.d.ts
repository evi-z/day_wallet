declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
  }
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Quasar предоставляемые переменные
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly DEBUGGING: boolean;
  readonly CLIENT: boolean;
  readonly SERVER: boolean;
  readonly MODE: string;
  readonly NODE_ENV: 'development' | 'production';

  // Пользовательские переменные окружения
  readonly VITE_BACKEND_HOST: string;
  readonly VITE_BACKEND_PORT: string;
  readonly VITE_BACKEND_PROTOCOL: string;

  readonly VITE_COUCHDB_HOST: string;
  readonly VITE_COUCHDB_PORT: string;
  readonly VITE_COUCHDB_PROTOCOL: string;

  readonly VITE_FRONTEND_DEV_PORT: string;

  // Мета-переменные
  readonly VITE_APP_ENV: string;
  readonly VITE_IS_PRODUCTION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
