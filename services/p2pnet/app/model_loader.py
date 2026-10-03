from __future__ import annotations

from loguru import logger

from app.inference import P2PNetPredictor
from app.settings import get_settings


class ModelState:
    def __init__(self) -> None:
        self.predictor: P2PNetPredictor | None = None

    @property
    def is_ready(self) -> bool:
        return self.predictor is not None

    def load(self) -> None:
        if self.predictor is not None:
            logger.debug("model_load_skipped already_ready=true")
            return

        settings = get_settings()
        logger.info(
            "model_load_started weight_path={} device={} threshold={} max_side={} tile_size={}",
            settings.model_weight_path,
            settings.device,
            settings.default_threshold,
            settings.max_inference_side,
            settings.tile_size,
        )
        try:
            self.predictor = P2PNetPredictor(
                weight_path=settings.model_weight_path,
                device=settings.device,
                threshold=settings.default_threshold,
                max_side=settings.max_inference_side,
                tile_size=settings.tile_size,
            )
        except Exception:
            logger.exception("model_load_failed")
            raise

        logger.info("model_load_completed ready=true")

    def get_predictor(self) -> P2PNetPredictor:
        if self.predictor is None:
            logger.error("predictor_requested_before_model_ready")
            raise RuntimeError("P2PNet model is not loaded")

        return self.predictor


model_state = ModelState()
