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
    Index: "Index",
} as const;

export type PageNames = (typeof PAGES)[keyof typeof PAGES]
