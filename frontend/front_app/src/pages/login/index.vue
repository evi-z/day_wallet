<template>
    <q-layout>
        <q-page-container>
            <q-page class="login-page fullscreen column justify-center items-center">
                <!-- Декоративные элементы фона -->
                <div class="bg-decoration bg-decoration-1"></div>
                <div class="bg-decoration bg-decoration-2"></div>
                <div class="bg-decoration bg-decoration-3"></div>

                <div class="login-container">
                    <!-- Логотип или название -->
                    <div class="text-center q-mb-lg">
                        <div class="login-logo">
                            <q-icon name="account_balance_wallet" size="3rem" color="white"></q-icon>
                        </div>
                        <div class="login-title text-white text-h4 text-weight-light q-mt-md">
                            Day Wallet
                        </div>
                        <div class="login-subtitle text-white text-weight-light text-subtitle1 q-mt-xs">
                            {{ welcomeText }}
                        </div>
                    </div>

                    <q-card class="login-card shadow-24" flat>
                        <q-card-section class="q-pa-xl relative-position">
                            <div class="arrow-back-btn" v-if="isRegisterMode" @click="switchToLoginForm">
                                <q-btn flat round size="md" icon="sym_o_arrow_back" color="grey-7" tabindex="-1" />
                            </div>
                            <div class="text-center q-mb-xl">
                                <div class="text-grey-9 text-h5">
                                    {{ formTitle }}
                                </div>
                            </div>

                            <q-form @submit.prevent="submitForm" ref="formRef">
                                <div class="form-fields-container q-gutter-y-md">
                                    <!-- Поля для регистрации: полное имя -->
                                    <transition name="form-field" mode="out-in">
                                        <q-input v-if="isRegisterMode" outlined v-model="(form as RegisterForm).name"
                                            label="Имя" color="primary" autofocus label-color="grey-7"
                                            class="login-input" spellcheck="false" @keyup.enter="submitForm"
                                            :rules="[reqRule('Введите ваше имя')]" hide-bottom-space
                                            lazy-rules='ondemand' key="fullname-field">
                                            <template #prepend>
                                                <q-icon name="sym_o_person" color="primary"></q-icon>
                                            </template>
                                        </q-input>
                                    </transition>
                                    <q-input outlined v-model="form.email" label="Email" color="primary"
                                        :autofocus="isLoginMode" label-color="grey-7" class="login-input"
                                        autocomplete="email" spellcheck="false" @keyup.enter="submitForm"
                                        :rules="[reqRule('Введите почтовый адрес')]" hide-bottom-space
                                        lazy-rules='ondemand'>
                                        <template #prepend>
                                            <q-icon name="sym_o_mail" color="primary"></q-icon>
                                        </template>
                                    </q-input>

                                    <!-- Поле пароля -->
                                    <q-input outlined v-model="form.password"
                                        :type="state.passwordVisible ? 'text' : 'password'" label="Пароль"
                                        color="primary" label-color="grey-7" class="login-input"
                                        :autocomplete="isLoginMode ? 'current-password' : 'new-password'"
                                        spellcheck="false" @keyup.enter="submitForm"
                                        :rules="isLoginMode ? [reqRule('Введите пароль')] : [reqRule('Введите пароль'), passwordRule]"
                                        hide-bottom-space lazy-rules='ondemand'>
                                        <template #prepend>
                                            <q-icon name="sym_o_lock" color="primary"></q-icon>
                                        </template>
                                        <template #append>
                                            <q-btn dense flat round size="sm" tabindex="-1"
                                                :icon="state.passwordVisible ? 'visibility' : 'visibility_off'"
                                                color="grey-6" @click="state.passwordVisible = !state.passwordVisible"
                                                :aria-label="state.passwordVisible ? 'Скрыть пароль' : 'Показать пароль'" />
                                        </template>
                                    </q-input>

                                    <!-- Поле подтверждения пароля (только для регистрации) -->
                                    <transition name="form-field" mode="out-in">
                                        <q-input v-if="isRegisterMode" outlined
                                            v-model="(form as RegisterForm).confirm_password"
                                            :type="state.passwordVisible ? 'text' : 'password'"
                                            label="Подтвердите пароль" color="primary" label-color="grey-7"
                                            class="login-input" autocomplete="new-password" spellcheck="false"
                                            @keyup.enter="submitForm" :rules="[confirmPasswordRule]" hide-bottom-space
                                            key="confirm-password-field">
                                            <template #prepend>
                                                <q-icon name="sym_o_lock" color="primary"></q-icon>
                                            </template>
                                        </q-input>
                                    </transition>
                                </div>

                                <div class="q-mt-lg">
                                    <q-btn color="primary" class="full-width login-button" type="submit"
                                        :label="submitBtnText" no-caps unelevated size="lg"
                                        :loading="state.submitBtnLoading" :disabled="!isFormFilled">
                                        <template #loading>
                                            <q-spinner-oval />
                                        </template>
                                    </q-btn>
                                </div>
                            </q-form>

                            <!-- Дополнительные опции -->
                            <div class="text-center q-mt-md" v-if="isLoginMode">
                                <div class="column q-y-gutter-xs justify-center">
                                    <q-btn flat no-caps dense label="Зарегистрироваться" color="primary"
                                        class="secondary-button" @click="switchToRegisterForm" />
                                    <q-btn flat no-caps dense label="Оффлайн режим" color="deep-orange-8"
                                        class="secondary-button" @click="clickLocalModeBtn" />
                                    <!-- <q-btn flat no-caps dense label="Забыли пароль?" color="grey-7"
                                        class="secondary-button text-sm" @click="$router.push('/forgot-password')" /> -->
                                </div>
                            </div>

                            <!-- Разделитель -->
                            <div class="q-my-md">
                                <div class="custom-separator">
                                    <span class="separator-text text-grey-6 text-caption">или войдите через</span>
                                </div>
                            </div>

                            <!-- Социальные входы -->
                            <div class="text-center">
                                <div class="row q-gutter-x-sm justify-center">
                                    <q-btn round disable class="social-button social-yandex" @click="loginWithYandex"
                                        aria-label="Войти через Яндекс">
                                        <q-icon name="fa-brands fa-yandex" size="24px" color="red-10" />
                                    </q-btn>
                                    <q-btn round disable class="social-button social-vk" @click="loginWithVK"
                                        aria-label="Войти через VK">
                                        <q-icon name="fa-brands fa-vk" size="34px" color="blue-10" />
                                    </q-btn>
                                    <q-btn round disable class="social-button social-google" @click="loginWithGoogle"
                                        aria-label="Войти через Google">
                                        <q-icon name="fa-brands fa-google" size="24px" color="light-blue-8" />
                                    </q-btn>
                                </div>
                            </div>
                        </q-card-section>
                    </q-card>
                </div>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script setup lang="ts">
import { QForm, useQuasar } from 'quasar';
import { PAGES } from 'src/router/models';
import { computed, nextTick, reactive, ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';
import { reqRule } from 'src/utils/form-rules';
import { LoginFormModeMap, LoginFormMode, LoginFormDefault, LoginOrRegisterForm, RegisterForm, RegisterFormDefault, LoginForm } from './models';
import api from 'src/api';
import app from 'src/services/app';

const $q = useQuasar();
const $router = useRouter();

// Основное состояние приложения
const state = reactive({
    currentFormMode: LoginFormMode.login as LoginFormModeMap,
    passwordVisible: false,
    submitBtnLoading: false,
})

// Форма логина
const form = ref<LoginOrRegisterForm>({ ...LoginFormDefault })

// Computed свойства для активной формы
const isLoginMode = computed(() => state.currentFormMode === LoginFormMode.login)
const isRegisterMode = computed(() => state.currentFormMode === LoginFormMode.register)

const isFormFilled = computed(() => Object.values(form.value).every(value => !!value))

const formTitle = computed(() => {
    return isLoginMode.value ? 'Вход в систему' : 'Регистрация';
})

const welcomeText = computed(() => {
    return isLoginMode.value ? 'Добро пожаловать' : 'Создание аккаунта';
})

const submitBtnText = computed(() => {
    return isLoginMode.value ? 'Войти' : 'Зарегистрироваться';
})

const formRef = useTemplateRef('formRef');

const passwordRule = (val: string) => {
    if (val.length < 4) return 'Пароль должен содержать минимум 4 символов';


    return true;
};

const confirmPasswordRule = (val: string) => {
    if (val !== form.value.password) return 'Пароли не совпадают';
    return true;
};

// Основная функция отправки формы
const submitForm = async () => {
    if (!isFormFilled.value) return

    return formRef.value?.validate().then(async () => {

        state.submitBtnLoading = true;

        try {
            if (isLoginMode.value) {
                await handleLogin();
            } else {
                await handleRegister();
            }
        } catch (error) {
            console.warn('Ошибка отправки формы:', error);
        } finally {
            state.submitBtnLoading = false;
        }
    })
};

// Обработка логина
const handleLogin = async () => {
    return api.auth.login(form.value as LoginForm).then(async(res) => {
        await app.login(res);
        $router.push({ name: PAGES.Index });
    }).catch((err) => {
        console.error(err);
        $q.notify({
            type: "negative",
            message: "Ошибка при входе. Попробуйте снова.",
        });
    })
};

// Обработка регистрации
const handleRegister = async () => {
    state.submitBtnLoading = true;
    return api.auth.register(form.value as RegisterForm).then(async(res) => {
        $q.notify({
            type: "positive",
            message: "Вы зарегистрированы!",
        })

        await switchToLoginForm()
    }).catch((err) => {
        $q.notify({
            type: "negative",
            message: "Ошибка при регистрации. Попробуйте снова.",
        });
    }).finally(() => {
        state.submitBtnLoading = false;
    })
}

const switchToLoginForm = async () => {
    form.value = { ...LoginFormDefault }
    await nextTick()
    state.currentFormMode = LoginFormMode.login;
    state.passwordVisible = false;
}

const switchToRegisterForm = async () => {
    form.value = { ...RegisterFormDefault, email: form.value.email }
    await nextTick()
    state.currentFormMode = LoginFormMode.register;
    state.passwordVisible = false;
};

// Социальные сети (пока заглушки)
const loginWithYandex = () => {
    console.log('Вход через Яндекс будет реализован позже');
};

const loginWithVK = () => {
    console.log('Вход через VK будет реализован позже');
};

const loginWithGoogle = () => {
    console.log('Вход через Google будет реализован позже');
};

// Переход в оффлайн режим
const clickLocalModeBtn = () => {
    $router.push({ name: PAGES.Index });
};
</script>

<style lang="scss" scoped>
$form-element-radius: 12px;
$login-card-background: rgba(255, 255, 255, 0.95);

.login-page {
    background: linear-gradient(135deg,
            $primary 0%,
            mix(black, $primary, 90%) 50%,
            $accent 100%);
    position: relative;
    overflow: hidden;
    min-height: 100dvh;

    .login-container {
        width: 100%;
        max-width: 420px;
        padding: 24px;
        z-index: 10;
        position: relative;

        .login-logo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            transition: all 0.3s ease;

            &:hover {
                transform: scale(1.05);
                background: rgba(255, 255, 255, 0.2);
            }
        }

        .login-title {
            background: linear-gradient(135deg,
                    rgba(255, 255, 255, 1) 0%,
                    rgba(255, 255, 255, 0.8) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-family: 'Roboto', sans-serif;
        }

        .login-subtitle {
            opacity: 0.95;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .login-card {
            background: $login-card-background;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 24px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
            animation: cardSideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);

            &:hover,
            &:focus-within {
                transform: scale(1.01);
            }

            // Анимации для переключения полей формы
            .form-fields-container {
                transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            }

            .form-field-enter-active {
                transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
            }

            .form-field-leave-active {
                transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
                position: absolute;
                width: 100%;
            }

            .form-field-enter-from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
            }

            .form-field-leave-to {
                opacity: 0;
                transform: translateY(-30px) scale(0.9);
            }

            .arrow-back-btn {
                position: absolute;
                top: 8px;
                left: 8px;
            }

            .login-input {
                :deep(.q-field__control) {
                    border-radius: $form-element-radius;
                    transition: all 0.3s ease;

                    &:hover {
                        // Hover эффект primary цвета при наведении
                        box-shadow: 0 4px 12px rgba($primary, 0.15);
                    }
                }

                :deep(.q-field__append .q-btn) {
                    // Hover эффекты для кнопок в append slot-е (e.g. показать/скрыть пароль)
                    transition: all 0.2s ease;

                    &:hover {
                        background-color: rgba($primary, 0.1);
                        transform: scale(1.1);
                    }
                }
            }

            .login-button {
                border-radius: $form-element-radius;
                font-weight: 600;
                font-size: 16px;
                // padding: 16px 0;
                position: relative;
                overflow: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                background: linear-gradient(135deg,
                        $primary 0%,
                        mix(black, $primary, 95%) 100%);

                &:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba($primary, 0.4);

                    &::before {
                        left: 100%;
                    }
                }

                &:active {
                    transform: translateY(0);
                }

                &::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg,
                            transparent,
                            rgba(255, 255, 255, 0.2),
                            transparent);
                    transition: left 0.5s;
                }

                // Стили для disabled состояния
                &:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;

                    &:hover {
                        transform: none !important;
                        box-shadow: none !important;
                    }
                }

                :deep(.q-spinner) {
                    // Анимация спиннера при loading
                    animation: buttonSpin 1s linear infinite;
                }
            }

            // Стили для дополнительных кнопок
            .secondary-button {
                transition: all 0.2s ease;

                &:hover {
                    transform: translateY(-1px);
                }
            }

            // Кастомный разделитель
            .custom-separator {
                display: flex;
                align-items: center;
                text-align: center;

                &::before,
                &::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background-color: $grey-4;
                }

                .separator-text {
                    padding: 0 16px;
                    white-space: nowrap;
                }
            }

            .social-button {
                width: 58px;
                height: 58px;
                background: white;
                border: 1px solid #e0e0e0;
                transition: all 0.3s ease;

                &:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }

                &.social-yandex {
                    &:hover {
                        border-color: $red-10;
                        background: #fffbf0;
                    }
                }

                &.social-vk {
                    &:hover {
                        border-color: $blue-10;
                        background: #f0f7ff;
                    }
                }

                &.social-google {
                    &:hover {
                        border-color: $light-blue-8;
                        background: #fff5f4;
                    }
                }
            }
        }
    }

}

// Декоративные элементы фона
.bg-decoration {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    animation: float 20s infinite linear;
}

.bg-decoration-1 {
    width: 300px;
    height: 300px;
    top: -150px;
    right: -150px;
    animation-delay: 0s;
}

.bg-decoration-2 {
    width: 200px;
    height: 200px;
    bottom: -100px;
    left: -100px;
    animation-delay: -10s;
}

.bg-decoration-3 {
    width: 150px;
    height: 150px;
    top: 50%;
    left: -75px;
    animation-delay: -5s;
}

@keyframes float {
    0% {
        transform: translateY(0px) rotate(0deg);
    }

    33% {
        transform: translateY(-30px) rotate(120deg);
    }

    66% {
        transform: translateY(30px) rotate(240deg);
    }

    100% {
        transform: translateY(0px) rotate(360deg);
    }
}

@keyframes buttonSpin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

// Responsive дизайн
@media (max-width: 600px) {
    .login-container {
        padding: 16px;
        max-width: 100%;
    }

    .login-card {
        margin: 0;
        border-radius: 20px;
    }

    .bg-decoration {
        display: none; // Скрываем декорации на мобильных
    }
}

@keyframes cardSideUp {
    0% {
        opacity: 0;
        transform: translateY(30px);
    }

    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

// Дополнительные улучшения для мобильных устройств
@media (max-width: 600px) {
    .login-title {
        font-size: 2rem !important;
    }

    .login-card {
        .q-card-section {
            padding: 2rem 1.5rem !important;
        }
    }

    .login-input {
        :deep(.q-field__control) {
            border-radius: 10px;
        }
    }

    .login-button {
        border-radius: 10px;
        font-size: 15px;
    }
}
</style>
