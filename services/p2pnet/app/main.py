from __future__ import annotations

import asyncio
from time import perf_counter
from uuid import uuid4
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI, Request, Response
from loguru import logger

from app.health import router as health_router
from app.model_loader import model_state
from app.observability import configure_logging
from app.predict import router as predict_router
from app.settings import get_settings

try:
    import resource
except ImportError:  # Windows não tem o módulo resource.
    resource = None


async def log_resource_heartbeat(interval_seconds: int) -> None:
    if resource is None:
        logger.debug("resource_heartbeat_disabled reason=resource_module_unavailable")
        return

    while True:
        usage = resource.getrusage(resource.RUSAGE_SELF)
        # Linux reports ru_maxrss in KiB; the service runs in Linux containers.
        logger.debug("resource_heartbeat max_rss_kib={}", usage.ru_maxrss)
        await asyncio.sleep(interval_seconds)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configured_level = configure_logging(settings.log_level)
    logger.info(
        "service_starting port={} device={} log_level={} heartbeat_seconds={}",
        settings.port,
        settings.device,
        configured_level,
        settings.heartbeat_seconds,
    )
    model_state.load()
    heartbeat_task = asyncio.create_task(log_resource_heartbeat(settings.heartbeat_seconds))
    try:
        yield
    except Exception:
        logger.exception("service_lifespan_failed")
        raise
    finally:
        heartbeat_task.cancel()
        await asyncio.gather(heartbeat_task, return_exceptions=True)
        logger.warning("service_stopping")


app = FastAPI(
    title="Aglo P2PNet Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(health_router)
app.include_router(predict_router)


@app.middleware("http")
async def log_request(request: Request, call_next) -> Response:
    request_id = request.headers.get("x-request-id") or str(uuid4())
    started_at = perf_counter()
    logger.debug(
        "request_started request_id={} method={} path={} content_length={}",
        request_id,
        request.method,
        request.url.path,
        request.headers.get("content-length", "0"),
    )
    try:
        response = await call_next(request)
    except Exception:
        logger.exception(
            "request_unhandled_exception request_id={} method={} path={}",
            request_id,
            request.method,
            request.url.path,
        )
        raise

    response.headers["x-request-id"] = request_id
    logger.info(
        "request_completed request_id={} method={} path={} status={} elapsed_ms={:.2f}",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        (perf_counter() - started_at) * 1_000,
    )
    return response
