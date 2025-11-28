FROM python:3.13.9-slim-trixie

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update -y
COPY --from=ghcr.io/astral-sh/uv:0.9.12 /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml ./
RUN uv sync --no-dev

COPY . /app

RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["uv", "run", "granian", "--interface", "asgi", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "backend_app.asgi:application"]