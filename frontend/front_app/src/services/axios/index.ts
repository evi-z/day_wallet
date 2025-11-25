import axios, {
    AxiosError,
    AxiosRequestConfig,
    InternalAxiosRequestConfig,
} from "axios";
import { handleResponseError } from "./handlers";
import ApiResponse from "./axios";
import app from "../app";
import { config } from "@/config";


const TIMEOUT = 10000

const axiosConfig: Partial<AxiosRequestConfig> = {
    baseURL: config.BACKEND_API_PATH,
    timeout: TIMEOUT,
    showErrorNotify: true,
    fullResponse: false,
} as const

const api = axios.create(axiosConfig);

const onRequest = async (
    req: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> => {
    /** Auto-slash */
    const url = req.url!;
    req.url = url.endsWith("/") ? url : url + "/";

    /** Add auth token */
    if (app.user?.auth_token) {
        req.headers["Authorization"] = `Token ${app.user.auth_token}`;
    }

    return req;
};

const onRequestError = (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
};

const onResponse: typeof ApiResponse = (response) => {
    return response.data;
}

const onResponseError = (error: AxiosError) => {
    if (!error.config?.showErrorNotify) handleResponseError(error);

    return Promise.reject(error);
};

api.interceptors.request.use(onRequest, onRequestError);
api.interceptors.response.use(onResponse, onResponseError);

export default api;
