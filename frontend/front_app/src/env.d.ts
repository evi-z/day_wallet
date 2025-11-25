
export interface EnvVariables {
  // Backend
  readonly BACKEND_API_PATH: string;
  readonly BACKEND_DEV_HOSTNAME: string;
  readonly BACKEND_DEV_PORT: string;
  // Frontend
  readonly FRONTEND_DEV_PORT: string;
}

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
  }
}
