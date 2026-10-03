FROM python:3.12 AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
      --extra-index-url https://download.pytorch.org/whl/cpu \
      -r requirements.txt


FROM python:3.12 AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo \
    libopenjp2-7 \
    zlib1g \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 1000 appuser

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

COPY app ./app
COPY vendor ./vendor
COPY SHTechA.pth ./weights/SHTechA.pth

ENV PORT=3000 \
    MODEL_WEIGHT_PATH=/app/weights/SHTechA.pth \
    DEFAULT_THRESHOLD=0.5 \
    DEVICE=cpu \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    LOG_LEVEL=INFO \
    UVICORN_LOG_LEVEL=info \
    P2PNET_HEARTBEAT_SECONDS=60

RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 3000 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request,sys,os; sys.exit(0) if urllib.request.urlopen(f'http://127.0.0.1:{os.environ[\"PORT\"]}/health').status == 200 else sys.exit(1)"

CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --log-level ${UVICORN_LOG_LEVEL:-info} --access-log --no-use-colors"]
