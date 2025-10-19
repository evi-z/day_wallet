import "axios";

declare module "axios" {
    interface AxiosRequestConfig {
        showErrorNotify?: Boolean; // Показывать дефолтную ошибку в уведомлении
        fullResponse?: Boolean; // Вернуть весь response (default: response.data)
        forbiddenRedirect?: Boolean; // Перенаправить на страницу 403 (default: true)
    }

    type ResponseResults<T = any> = {
        items: T;
    };
    type ResponsePaginatedList<T = any> = {
        count: number;
        next: string | null;
        previous: string | null;
        items: T[];
    };

    interface AxiosInstance {
        <T = any, R = AxiosResponse<T>, D = any, A = any>(
            config: AxiosRequestConfig<D>,
        ): Promise<T>;
        // <R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<D>;
    }
}