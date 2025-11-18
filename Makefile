.PHONY: help docker-up docker-down docker-logs docker-clean docker-exec-db couchdb-ui

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

frontend-run: ## Запуск frontend
	@echo "$(GREEN)Запуск frontend...$(NC)"
	cd frontend/front_app && pnpm run dev
	@echo "$(GREEN)✓ Frontend запущен$(NC)"

backend-run: ## Запуск backend
	@echo "$(GREEN)Запуск backend...$(NC)"
	cd backend && uv run python manage.py runserver
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
	@echo "$(GREEN)CouchDB UI: http://localhost:5984/_utils$(NC)"
	@echo "$(YELLOW)Логин: admin$(NC)"
	@echo "$(YELLOW)Пароль: adminpass$(NC)"

# По умолчанию показывать help
.DEFAULT_GOAL := help