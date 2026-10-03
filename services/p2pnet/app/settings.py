from __future__ import annotations

import os
from dataclasses import dataclass

MAX_INFERENCE_SIDE = 2048
INFERENCE_TILE_SIZE = 1024


@dataclass(frozen=True)
class Settings:
    port: int
    model_weight_path: str
    default_threshold: float
    device: str
    max_inference_side: int
    tile_size: int
    log_level: str
    heartbeat_seconds: int


def get_settings() -> Settings:
    return Settings(
        port=int(os.getenv("PORT", "8001")),
        model_weight_path=os.getenv("MODEL_WEIGHT_PATH", "./weights/SHTechA.pth"),
        default_threshold=float(os.getenv("DEFAULT_THRESHOLD", "0.5")),
        device=os.getenv("DEVICE", "cpu"),
        max_inference_side=int(os.getenv("MAX_INFERENCE_SIDE", str(MAX_INFERENCE_SIDE))),
        tile_size=int(os.getenv("INFERENCE_TILE_SIZE", str(INFERENCE_TILE_SIZE))),
        log_level=os.getenv("LOG_LEVEL", "INFO"),
        heartbeat_seconds=max(1, int(os.getenv("P2PNET_HEARTBEAT_SECONDS", "60"))),
    )
