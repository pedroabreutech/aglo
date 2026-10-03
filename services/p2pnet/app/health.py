from __future__ import annotations

from fastapi import APIRouter, Response, status
from loguru import logger

from app.model_loader import model_state

router = APIRouter()


@router.get("/health")
def health(response: Response) -> dict[str, str]:
    if not model_state.is_ready:
        logger.warning("healthcheck_not_ready")
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "loading"}

    return {"status": "ok"}
