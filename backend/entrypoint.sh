#!/bin/bash

set -e  # Завершить скрипт с ошибкой в случае неудачи

mkdir -p /app/data

if [ "$MAIN_BACKEND_CONTAINER" = "1" ]; then  # Только в базовом контейнере
    uv run python manage.py migrate --noinput
    uv run python manage.py collectstatic --noinput
fi

exec "$@"  # CMD из Dockerfile

