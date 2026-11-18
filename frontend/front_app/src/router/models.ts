import "vue-router";
export { };

declare module "vue-router" {
    interface RouteMeta {
        title: string;
        hidden?: boolean;
        icon?: string;
        whiteList?: boolean; // Страница доступна для незалогиненных пользователей
    }
}

export const PAGES = {
    Login: "Login", // (!) Имя не менять (логика редиректа в hooks)
    Pulse: "Pulse",
    Accounts: "Accounts",
    Expenses: "Expenses",
    Plan: "Plan",
    Settings: "Settings",
} as const;

export type PageNames = (typeof PAGES)[keyof typeof PAGES]
