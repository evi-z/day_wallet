.PHONY: help docker-up docker-down docker-logs docker-clean docker-exec-db couchdb-ui

# Загрузка переменных из .env файла
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

# Значения по умолчанию для переменных backend
FRONTEND_DEV_PORT ?= 9876
BACKEND_DEV_HOSTNAME ?= 127.0.0.1
BACKEND_DEV_PORT ?= 8000

# Цвета для вывода
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Показать это сообщение помощи
	@echo "$(GREEN)Доступные команды:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

frontend-setup:  ## Обновление зависимостей frontend
	@echo "$(GREEN)Обновление зависимостей frontend...$(NC)"
	cd frontend/front_app && pnpm install
	@echo "$(GREEN)✓ Зависимости frontend установлены$(NC)"

backend-setup:  ## Обновление зависимостей backend
	@echo "$(GREEN)Обновление зависимостей backend...$(NC)"
	cd backend && uv sync
	@echo "$(GREEN)✓ Зависимости backend установлены$(NC)"

setup: frontend-setup backend-setup ## Обновление зависимостей frontend и backend

makemigrations-backend: ## Создать миграции базы данных
	@echo "$(GREEN)Создание миграций backend...$(NC)"
	cd backend && uv run python manage.py makemigrations
	@echo "$(GREEN)✓ Миграции созданы$(NC)"

migrate-backend: ## Выполнить миграции базы данных
	@echo "$(GREEN)Выполнение миграций backend...$(NC)"
	cd backend && uv run python manage.py migrate --noinput
	@echo "$(GREEN)✓ Миграции выполнены$(NC)"

frontend-run: ## Запуск frontend
	@echo "$(GREEN)Запуск frontend...$(NC)"
	@kill -9 $$(lsof -t -i:$(FRONTEND_DEV_PORT)) 2>/dev/null || true
	cd frontend/front_app && pnpm run dev
	@echo "$(GREEN)✓ Frontend запущен$(NC)"

backend-run: ## Запуск backend
	@echo "$(GREEN)Запуск backend...$(NC)"
	@kill -9 $$(lsof -t -i:$(BACKEND_DEV_PORT)) 2>/dev/null || true
	cd backend && uv run python manage.py runserver $(BACKEND_DEV_HOSTNAME):$(BACKEND_DEV_PORT)
	@echo "$(GREEN)✓ Backend запущен$(NC)"

docker-up: ## Запустить все сервисы
	@echo "$(GREEN)Запуск сервисов...$(NC)"
	docker-compose up --build
	@echo "$(GREEN)✓ Сервисы запущены$(NC)"

docker-down: ## Остановить все сервисы
	@echo "$(YELLOW)Остановка сервисов...$(NC)"
	docker-compose down
	@echo "$(GREEN)✓ Сервисы остановлены$(NC)"

docker-logs: ## Показать логи в режиме follow
	docker-compose logs -f

docker-clean: ## Удалить контейнеры, volumes и сети
	@echo "$(RED)Удаление контейнеров, volumes и сетей...$(NC)"
	docker-compose down -v
	@echo "$(GREEN)✓ Очистка завершена$(NC)"

docker-exec-db: ## Выполнить команду в контейнере CouchDB (использование: make exec-db CMD="<команда>")
	docker-compose exec develop-couchdb $(CMD)

couchdb-ui: ## Открыть CouchDB UI в браузере
	@echo "$(GREEN)CouchDB UI: http://$(COUCHDB_HOST):$(COUCHDB_PORT)/_utils$(NC)"
	@echo "$(YELLOW)Логин: $(COUCHDB_ADMIN_USERNAME)$(NC)"
	@echo "$(YELLOW)Пароль: $(COUCHDB_ADMIN_PASSWORD)$(NC)"

kill-ports: ## Закрыть все порты
	@echo "$(RED)Закрытие всех портов...$(NC)"
	@kill -9 $$(lsof -t -i:$(BACKEND_DEV_PORT)) 2>/dev/null || true
	@kill -9 $$(lsof -t -i:$(FRONTEND_DEV_PORT)) 2>/dev/null || true
	@echo "$(GREEN)✓ Порты закрыты$(NC)"

# По умолчанию показывать help
.DEFAULT_GOAL := help