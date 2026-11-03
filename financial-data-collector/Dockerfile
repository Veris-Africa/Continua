# Build from the repository root. Private R2 remains the durable artifact store.
FROM python:3.13.16-slim-bookworm@sha256:a1165e272e578941b84abc79e4ab38a0305cd12803a5c4247979ac7655f4d641
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates chromium chromium-driver \
       poppler-utils tesseract-ocr tesseract-ocr-eng fonts-liberation \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 continua \
    && useradd --uid 10001 --gid 10001 --create-home continua
WORKDIR /app
COPY financial-data-collector/requirements-lock.txt /app/requirements-lock.txt
RUN pip install --no-cache-dir -r /app/requirements-lock.txt
RUN python -m pip check \
    && apt-get update \
    && apt-get install -y --no-install-recommends chromium-sandbox \
    && rm -rf /var/lib/apt/lists/*
COPY financial-data-collector/main.py financial-data-collector/browser_worker.py financial-data-collector/scraper_cli.py financial-data-collector/
COPY financial-data-collector/continua_scraper/ financial-data-collector/continua_scraper/
COPY financial-engine/continua_engine/ financial-engine/continua_engine/
COPY backend/python/engine_calculations.py backend/python/engine_calculations.py
COPY scraper/python/pdf_extract.py scraper/python/pdf_extract.py
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/financial-engine \
    CHROMIUM_BIN=/usr/bin/chromium CHROMEDRIVER_BIN=/usr/bin/chromedriver
USER 10001:10001
# Do not disable Chromium's sandbox. Linux namespace/sandbox compatibility and
# the complete service memory budget must pass the final release validation.
EXPOSE 4081
ENTRYPOINT ["python", "/app/financial-data-collector/main.py"]
