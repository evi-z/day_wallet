// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file

import { defineConfig } from '#q-app/wrappers';
import envVariables from "./envs/env_parser";

export default defineConfig((ctx) => {
    // Получаем все env переменные через парсер
    const env = envVariables();

    return {
        boot: [
            'init_app'
        ],

        css: ['app.scss'],

        // https://github.com/quasarframework/quasar/tree/dev/extras
        extras: [
            // 'ionicons-v4',
            // 'mdi-v7',
            'fontawesome-v6',
            // 'eva-icons',
            // 'themify',
            // 'line-awesome',
            // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!
            // 'roboto-font', // optional, you are not bound to it

            'material-icons', // optional, you are not bound to it
            'material-symbols-outlined', // optional, you are not bound to it
        ],

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#build
        build: {
            target: {
                browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
                node: 'node20'
            },

            typescript: {
                strict: true,
                vueShim: true
            },

            vueRouterMode: 'hash', // available values: 'hash', 'history'

            // Передаём переменные окружения (будут доступны через import.meta.env)
            env,

            rawDefine: {
                global: 'globalThis', // Полифилл для Node.js библиотек в браузере
            },

            // Расширяем конфигурацию Vite для правильной обработки env переменных
            extendViteConf(viteConf) {
                // Добавляем наши переменные в Vite define (правильный способ)
                viteConf.define = viteConf.define || {};
                Object.entries(env).forEach(([key, value]) => {
                    viteConf.define[`import.meta.env.${key}`] = JSON.stringify(value);
                });
            },
        },

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#devserver
        devServer: {
            // https: true,
            open: true, // opens browser window automatically
            port: parseInt(env.VITE_FRONTEND_DEV_PORT),

            // Proxy для dev режима: перенаправляем /db и /api на локальные сервисы
            // proxy: {
            //     // CouchDB proxy
            //     '/db': {
            //         target: `http://localhost:5984`,
            //         changeOrigin: true,
            //         pathRewrite: { '^/db': '' },
            //         configure: (proxy, options) => {
            //             // Логируем запросы для отладки (можно убрать потом)
            //             proxy.on('proxyReq', (proxyReq, req, res) => {
            //                 console.log(`[Proxy] ${req.method} ${req.url} -> ${options.target}${req.url}`);
            //             });
            //         }
            //     },

            //     // Backend API proxy (если нужен)
            //     '/api': {
            //         target: `http://${env.VITE_BACKEND_HOST}:${env.VITE_BACKEND_PORT}`,
            //         changeOrigin: true,
            //     }
            // }
        },

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#framework
        framework: {
            config: {},
            lang: 'ru', // Quasar language pack

            // iconSet: 'material-icons', // Quasar icon set
            // Quasar plugins
            plugins: [
                'Notify'
            ]
        },

        // animations: 'all', // --- includes all animations
        // https://v2.quasar.dev/options/animations
        animations: [],

        // https://v2.quasar.dev/quasar-cli-vite/developing-ssr/configuring-ssr
        ssr: {
            prodPort: 3000, // The default port that the production server should use
            // (gets superseded if process.env.PORT is specified at runtime)

            middlewares: [
                'render' // keep this as last one
            ],

            // extendPackageJson (json) {},
            // extendSSRWebserverConf (esbuildConf) {},

            // manualStoreSerialization: true,
            // manualStoreSsrContextInjection: true,
            // manualStoreHydration: true,
            // manualPostHydrationTrigger: true,

            pwa: false
            // pwaOfflineHtmlFilename: 'offline.html', // do NOT use index.html as name!

            // pwaExtendGenerateSWOptions (cfg) {},
            // pwaExtendInjectManifestOptions (cfg) {}
        },

        // https://v2.quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
        pwa: {
            workboxMode: 'GenerateSW' // 'GenerateSW' or 'InjectManifest'
            // swFilename: 'sw.js',
            // manifestFilename: 'manifest.json',
            // extendManifestJson (json) {},
            // useCredentialsForManifestTag: true,
            // injectPwaMetaTags: false,
            // extendPWACustomSWConf (esbuildConf) {},
            // extendGenerateSWOptions (cfg) {},
            // extendInjectManifestOptions (cfg) {}
        },

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-cordova-apps/configuring-cordova
        cordova: {
            // noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
        },

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-capacitor-apps/configuring-capacitor
        capacitor: {
            hideSplashscreen: true
        },

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
        electron: {
            // extendElectronMainConf (esbuildConf) {},
            // extendElectronPreloadConf (esbuildConf) {},

            // extendPackageJson (json) {},

            // Electron preload scripts (if any) from /src-electron, WITHOUT file extension
            preloadScripts: ['electron-preload'],

            // specify the debugging port to use for the Electron app when running in development mode
            inspectPort: 5858,

            bundler: 'packager', // 'packager' or 'builder'

            packager: {
                // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options

                // OS X / Mac App Store
                // appBundleId: '',
                // appCategoryType: '',
                // osxSign: '',
                // protocol: 'myapp://path',

                // Windows only
                // win32metadata: { ... }
            },

            builder: {
                // https://www.electron.build/configuration/configuration

                appId: 'day_wallet'
            }
        },

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
        bex: {
            // extendBexScriptsConf (esbuildConf) {},
            // extendBexManifestJson (json) {},

            /**
             * The list of extra scripts (js/ts) not in your bex manifest that you want to
             * compile and use in your browser extension. Maybe dynamic use them?
             *
             * Each entry in the list should be a relative filename to /src-bex/
             *
             * @example [ 'my-script.ts', 'sub-folder/my-other-script.js' ]
             */
            extraScripts: []
        }
    }
});
