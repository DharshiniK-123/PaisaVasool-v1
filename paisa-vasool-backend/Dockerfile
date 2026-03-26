FROM python:3.12-slim

# Create non-root user
RUN adduser --disabled-password --gecos "" appuser

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy dependency files first for layer caching
COPY pyproject.toml uv.lock ./

# Install production dependencies only
RUN uv sync --frozen --no-dev

# Copy source
COPY src/ ./src/

ENV PYTHONPATH=/app

# ✅ Fix: give appuser ownership of everything in /app
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

EXPOSE 8080

CMD ["sh", "-c", "/app/.venv/bin/uvicorn src.api.rest.app:app --host 0.0.0.0 --port ${PORT:-8080}"]