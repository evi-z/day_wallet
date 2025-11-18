import { AppUser } from 'src/models/user';
import { LoginForm, RegisterForm } from 'src/pages/login/models';
import request from 'src/services/axios';

export function register(data: RegisterForm) {
    return request({
        url: 'auth/register/',
        method: 'post',
        data,
    })
}

export function login(data: LoginForm) {
    return request<AppUser>({
        url: 'auth/login/',
        method: 'post',
        data,
    })
}

export function fetchUserInfo() {
    return request<{ db_username: string, db_password: string }>({
        url: 'auth/user-info/',
        method: 'get',
    })
}