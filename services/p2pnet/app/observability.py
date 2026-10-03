from __future__ import annotations

import logging
import os
import sys
from typing import Final

from loguru import logger


DEFAULT_LOG_LEVEL: Final = "INFO"
VALID_LOG_LEVELS: Final = {"TRACE", "DEBUG", "INFO", "SUCCESS", "WARNING", "ERROR", "CRITICAL"}


class InterceptHandler(logging.Handler):
    """Encaminha logs de FastAPI, Uvicorn e bibliotecas para o Loguru."""

    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        logger.opt(depth=6, exception=record.exc_info).log(level, record.getMessage())


def configure_logging(raw_level: str | None = None) -> str:
    level = (raw_level or os.getenv("LOG_LEVEL") or DEFAULT_LOG_LEVEL).upper()
    if level not in VALID_LOG_LEVELS:
        level = DEFAULT_LOG_LEVEL

    logger.remove()
    logger.add(
        sys.stderr,
        level=level,
        colorize=False,
        backtrace=True,
        diagnose=False,
        format=(
            "{time:YYYY-MM-DDTHH:mm:ss.SSSZ} | {level:<8} | "
            "pid={process.id} | {name}:{function}:{line} | {message} | {extra}"
        ),
    )

    intercept_handler = InterceptHandler()
    logging.basicConfig(handlers=[intercept_handler], level=0, force=True)
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"):
        named_logger = logging.getLogger(name)
        named_logger.handlers = [intercept_handler]
        named_logger.propagate = False

    return level
