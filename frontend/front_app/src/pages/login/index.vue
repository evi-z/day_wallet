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
                            Добро пожаловать
                        </div>
                    </div>

                    <q-card class="login-card shadow-24" flat>
                        <q-card-section class="q-pa-xl">
                            <div class="text-center q-mb-xl">
                                <div class="text-grey-9 text-h5">
                                    Вход в систему
                                </div>
                            </div>

                            <q-form @submit.prevent="login" class="q-gutter-md">
                                <q-input outlined v-model="loginForm.username" label="Номер или почта" color="primary"
                                    label-color="grey-7" class="login-input" autocomplete="username" spellcheck="false"
                                    :error="state.hasSubmitted && (!loginForm.username || loginForm.username.length === 0)"
                                    :error-message="state.hasSubmitted && (!loginForm.username || loginForm.username.length === 0) ? 'Поле обязательно для заполнения' : ''"
                                    hide-bottom-space>
                                    <template #prepend>
                                        <q-icon name="person_outline" color="primary"></q-icon>
                                    </template>
                                </q-input>

                                <q-input outlined v-model="loginForm.password"
                                    :type="state.passwordVisible ? 'text' : 'password'" label="Пароль" color="primary"
                                    label-color="grey-7" class="login-input" autocomplete="current-password"
                                    :error="state.hasSubmitted && (!loginForm.password || loginForm.password.length === 0)"
                                    :error-message="state.hasSubmitted && (!loginForm.password || loginForm.password.length === 0) ? 'Поле обязательно для заполнения' : ''"
                                    hide-bottom-space>
                                    <template #prepend>
                                        <q-icon name="lock_outline" color="primary"></q-icon>
                                    </template>
                                    <template #append>
                                        <q-btn dense flat round size="sm"
                                            :icon="state.passwordVisible ? 'visibility' : 'visibility_off'"
                                            color="grey-6" @click="state.passwordVisible = !state.passwordVisible"
                                            :aria-label="state.passwordVisible ? 'Скрыть пароль' : 'Показать пароль'" />
                                    </template>
                                </q-input>

                                <div class="q-mt-lg">
                                    <q-btn color="primary" class="full-width login-button" type="submit" label="Войти"
                                        no-caps unelevated size="lg" :loading="state.isLoading">
                                        <template #loading>
                                            <q-spinner-oval />
                                        </template>
                                    </q-btn>
                                </div>
                            </q-form>

                            <!-- Дополнительные опции -->
                            <div class="text-center q-mt-md">
                                <div class="column q-y-gutter-xs justify-center">
                                    <q-btn flat no-caps dense label="Зарегистрироваться" color="primary"
                                        class="secondary-button" @click="clickRegisterBtn" />
                                    <q-btn flat no-caps dense label="Оффлайн режим" color="deep-orange-8"
                                        class="secondary-button" @click="clickLocalModeBtn" />
                                    <q-btn  flat no-caps dense label="Забыли пароль?" color="grey-7"
                                        class="secondary-button text-sm" @click="$router.push('/forgot-password')" />

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
                                    <q-btn round class="social-button social-yandex" @click="loginWithYandex"
                                        aria-label="Войти через Яндекс">
                                        <q-icon name="fa-brands fa-yandex" size="24px" color="red-10" />
                                    </q-btn>
                                    <q-btn round class="social-button social-vk" @click="loginWithVK"
                                        aria-label="Войти через VK">
                                        <q-icon name="fa-brands fa-vk" size="34px" color="blue-10" />
                                    </q-btn>
                                    <q-btn round class="social-button social-google" @click="loginWithGoogle"
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
import { useQuasar } from 'quasar';
import { PAGES } from 'src/router/models';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const $router = useRouter();

const state = reactive({
    passwordVisible: false,
    isLoading: false,
    hasSubmitted: false,
})

const loginForm = ref({
    username: "",
    password: "",
});

const login = async () => {
    state.hasSubmitted = true;

    // Проверка валидации
    if (!loginForm.value.username || loginForm.value.username.length === 0) {
        return;
    }
    if (!loginForm.value.password || loginForm.value.password.length === 0) {
        return;
    }

    state.isLoading = true;

    try {
        // return api.user
        //     .loginRequest(loginForm.value)
        //     .then((res) => {
        //         $store.userStore.setToken(res.token).then(() => $router.go(0));
        //     })
        //     .catch((err) => {
        //         $q.notify({
        //             type: "warning",
        //             message: "Неверный логин или пароль",
        //         });
        //     });
    } catch (error) {
        console.warn('Ошибка авторизации:', error);
    } finally {
        state.isLoading = false;
    }
};

const loginWithYandex = () => {
    // TODO: Реализовать вход через Яндекс
    console.log('Вход через Яндекс будет реализован позже');
};

const loginWithVK = () => {
    // TODO: Реализовать вход через VK
    console.log('Вход через VK будет реализован позже');
};

const loginWithGoogle = () => {
    // TODO: Реализовать вход через Google
    console.log('Вход через Google будет реализован позже');
};

const clickRegisterBtn = () => {
    $router.push('/register');
}

const clickLocalModeBtn = () => {
    $router.push({ name: PAGES.Index });
}
</script>

<style lang="scss" scoped>
$form-element-radius: 12px;
$login-card-background: rgba(255, 255, 255, 0.95);

.login-page {
    background: linear-gradient(135deg,
            $primary 0%,
            darken($primary, 10%) 50%,
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
            animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1); // Анимация появления

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            }

            .login-input {
                transition: all 0.3s ease;

                :deep(.q-field__control) {
                    border-radius: $form-element-radius;
                    transition: all 0.3s ease;
                }

                :deep(.q-field__control:hover) {
                    box-shadow: 0 4px 12px rgba($primary, 0.15);
                }

                :deep(.q-field--focused .q-field__control) {
                    box-shadow: 0 0 0 2px rgba($primary, 0.2);
                    transform: scale(1.01);
                }

                :deep(.q-field__marginal) {
                    transition: all 0.3s ease;
                }

                // Улучшенные фокус-стили для доступности // TODO: Проверить
                :deep(.q-field--focused .q-field__control) {

                    outline: 2px solid rgba($primary, 0.3);
                    outline-offset: 2px;
                }

                // Стилизация ошибок валидации
                :deep(.q-field--error) {
                    // .q-field__control {
                    //     border-color: $negative !important;
                    //     box-shadow: 0 0 0 2px rgba($negative, 0.2) !important;
                    //     animation: shake 0.4s ease-in-out;
                    // }

                    // .q-field__messages {
                    //     color: $negative;
                    //     font-weight: 500;
                    //     animation: fadeInUp 0.3s ease-out;
                    // }

                    // .q-field__prepend .q-icon {
                    //     color: $negative !important;
                    // }
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
                        darken($primary, 5%) 100%);

                &:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba($primary, 0.4);
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

                &:hover::before {
                    left: 100%;
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



@keyframes slideUp {
    0% {
        opacity: 0;
        transform: translateY(30px);
    }

    100% {
        opacity: 1;
        transform: translateY(0);
    }
}



@keyframes shake {

    0%,
    100% {
        transform: translateX(0);
    }

    25% {
        transform: translateX(-4px);
    }

    75% {
        transform: translateX(4px);
    }
}

@keyframes fadeInUp {
    0% {
        opacity: 0;
        transform: translateY(10px);
    }

    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

// Улучшенные hover эффекты для кнопки показать/скрыть пароль
.login-input:deep(.q-field__append .q-btn) {
    transition: all 0.2s ease;

    &:hover {
        background-color: rgba($primary, 0.1);
        transform: scale(1.1);
    }
}

// Улучшенная анимация загрузки
.login-button:deep(.q-spinner) {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

// Стили для disabled состояния
.login-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;

    &:hover {
        transform: none !important;
        box-shadow: none !important;
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



// Стили для социальных кнопок
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
</style>
