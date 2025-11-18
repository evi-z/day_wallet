export const LoginFormMode = {
    login: 'login',
    register: 'register'
} as const;

export type LoginFormModeMap = (typeof LoginFormMode)[keyof typeof LoginFormMode];

export type LoginForm = {
    email: string;
    password: string;
}

export type RegisterForm = LoginForm & {
    name: string;
    confirm_password: string;
}

export type LoginOrRegisterForm = LoginForm | RegisterForm;

export const LoginFormDefault: LoginForm = {
    email: '',
    password: ''
} as const;

export const RegisterFormDefault: RegisterForm = {
    name: '',
    email: '',
    password: '',
    confirm_password: ''
} as const;
