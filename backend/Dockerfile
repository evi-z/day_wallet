FROM python:3.13.8-slim-trixie

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update -y
COPY --from=ghcr.io/astral-sh/uv:0.9.1 /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --no-dev --locked

COPY . /app

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["granian", "--interface", "asgi", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "backend_app.asgi:application"]