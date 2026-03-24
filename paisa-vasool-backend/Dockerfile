FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONPATH=/app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Optional (can remove or change to 8080)
EXPOSE 8080

CMD ["sh", "-c", "uvicorn src.api.rest.app:app --host 0.0.0.0 --port ${PORT:-8080}"]
