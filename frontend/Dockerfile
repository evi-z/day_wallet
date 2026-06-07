# Этап 1: Сборка приложения
FROM node:22.17.0 as builder

# Устанавливаем pnpm
RUN npm install -g pnpm@9.15.9

# Устанавливаем рабочую директорию в контейнере
WORKDIR /app

# Копируем .env файл
COPY .env ./

# Копируем файлы package.json и pnpm-lock.yaml для установки зависимостей
COPY frontend/front_app/package.json ./
COPY frontend/front_app/pnpm-lock.yaml ./
COPY frontend/front_app/.npmrc ./

# Устанавливаем зависимости с помощью pnpm
RUN pnpm install --frozen-lockfile

# Копируем остальные исходные файлы приложения
COPY frontend/front_app/ /app/

# Собираем приложение для production
RUN pnpm run build
FROM nginx:stable-alpine

# Устанавливаем часовой пояс
RUN rm -rf /etc/localtime && \
    ln -s /usr/share/zoneinfo/Europe/Moscow /etc/localtime

# Удаляем стандартную конфигурацию Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Копируем конфигурацию Nginx
COPY frontend/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Удаляем стандартный index.html от Nginx
RUN rm -rf /usr/share/nginx/html/*

# Копируем собранное приложение
COPY --from=builder /app/dist/spa /usr/share/nginx/html

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]