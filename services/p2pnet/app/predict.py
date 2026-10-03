from __future__ import annotations

import asyncio
from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile, status
from fastapi.responses import JSONResponse
from PIL import UnidentifiedImageError
from loguru import logger
from starlette.concurrency import run_in_threadpool


from app.annotate import build_annotated_image_base64
from app.inference import Prediction
from app.model_loader import model_state

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}

router = APIRouter()

# Inferências simultâneas somariam seus picos de memória no mesmo pod.
inference_lock = asyncio.Lock()


@router.post("/predict")
async def predict(
    file: Annotated[UploadFile | None, File()] = None,
    threshold: Annotated[str | None, Form()] = None,
    weight_path: Annotated[str | None, Form()] = None,
) -> JSONResponse:
    del weight_path
    if file is None:
        result = "Image file is required"
        logger.warning("prediction_rejected reason={}", result)
        return invalid_file(result)

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        result = "File must be JPEG, PNG, or WebP."
        logger.warning("prediction_rejected content_type={} reason={}", file.content_type, result)
        return invalid_file(result)

    image_bytes = await file.read()
    if not image_bytes:
        result = "Image file is empty."
        logger.warning("prediction_rejected content_type={} reason={}", file.content_type, result)
        return invalid_file(result)

    logger.info("prediction_started content_type={} bytes={} threshold={}", file.content_type, len(image_bytes), threshold)
    try:
        parsed_threshold = parse_threshold(threshold)
        # Fora do event loop, o /health continua respondendo durante a inferência.
        async with inference_lock:
            result, annotated_image_base64 = await run_in_threadpool(
                run_inference,
                image_bytes,
                parsed_threshold,
                file.content_type,
            )
    except (UnidentifiedImageError, ValueError) as error:
        logger.warning("prediction_rejected reason={}", str(error))
        return invalid_file(str(error))
    except Exception as error:
        logger.exception("prediction_failed content_type={} bytes={}", file.content_type, len(image_bytes))
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "inference_failed",
                "message": str(error),
            },
        )

    return JSONResponse(
        content={
            "estimatedCount": len(result.points),
            "points": result.points,
            "annotated_image_base64": annotated_image_base64,
        },
    )


def run_inference(
    image_bytes: bytes,
    threshold: float | None,
    content_type: str,
) -> tuple[Prediction, str]:
    result = model_state.get_predictor().predict(image_bytes, threshold=threshold)
    annotated_image_base64 = build_annotated_image_base64(
        image_bytes,
        result.points,
        content_type,
    )
    return result, annotated_image_base64


def parse_threshold(value: str | None) -> float | None:
    if value is None or value == "":
        return None

    try:
        return float(value)
    except ValueError as error:
        raise ValueError("threshold must be a number.") from error


def invalid_file(message: str) -> JSONResponse:
    logger.warning("invalid_file message={}", message)
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": "invalid_file",
            "message": message,
        },
    )
