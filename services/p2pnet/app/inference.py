from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from time import perf_counter
from types import SimpleNamespace

from PIL import Image
from loguru import logger
import torch
import torch.nn.functional as functional
from torchvision import transforms

from vendor.p2pnet.models import build_model

SIZE_STEP = 128


@dataclass(frozen=True)
class Detection:
    x: float
    y: float
    confidence: float


@dataclass(frozen=True)
class Prediction:
    detections: list[Detection]

    @property
    def points(self) -> list[list[float]]:
        return [[item.x, item.y] for item in self.detections]

    @property
    def confidences(self) -> list[float]:
        return [item.confidence for item in self.detections]


@dataclass(frozen=True)
class PreparedImage:
    image: Image.Image
    scale_x: float
    scale_y: float


class P2PNetPredictor:
    def __init__(
        self,
        weight_path: str | Path,
        device: str = "cpu",
        threshold: float = 0.5,
        max_side: int = 0,
        tile_size: int = 1024,
    ) -> None:
        if tile_size < 0 or tile_size % SIZE_STEP != 0:
            raise ValueError(f"tile_size must be 0 or a positive multiple of {SIZE_STEP}")

        logger.debug(
            "predictor_initializing device={} threshold={} max_side={} tile_size={}",
            device,
            threshold,
            max_side,
            tile_size,
        )
        self.device = torch.device(device)
        self.threshold = threshold
        self.max_side = max_side
        # O pico de memória da rede cresce com a área da entrada (~0,75 GB por
        # megapixel em CPU); blocos limitam o pico independentemente da foto.
        self.tile_size = tile_size
        self.model = self._load_model(Path(weight_path))
        self.transform = transforms.Compose(
            [
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225],
                ),
            ],
        )

    def predict(self, image_bytes: bytes, threshold: float | None = None) -> Prediction:
        started_at = perf_counter()
        prepared = self._load_image(image_bytes)
        logger.debug(
            "inference_prepared image_size={}x{} bytes={} scale_x={:.4f} scale_y={:.4f}",
            prepared.image.width,
            prepared.image.height,
            len(image_bytes),
            prepared.scale_x,
            prepared.scale_y,
        )
        score_threshold = self.threshold if threshold is None else threshold

        model_started_at = perf_counter()
        tiles = 0
        detections: list[Detection] = []
        for left, top, tile in self._iter_tiles(prepared.image):
            tiles += 1
            for x, y, confidence in self._predict_tile(tile, score_threshold):
                detections.append(
                    Detection(
                        x=(x + left) * prepared.scale_x,
                        y=(y + top) * prepared.scale_y,
                        confidence=confidence,
                    ),
                )
        model_elapsed_ms = (perf_counter() - model_started_at) * 1_000

        logger.debug(
            "inference_completed tiles={} detections={} threshold={} model_elapsed_ms={:.2f} total_elapsed_ms={:.2f}",
            tiles,
            len(detections),
            score_threshold,
            model_elapsed_ms,
            (perf_counter() - started_at) * 1_000,
        )
        return Prediction(detections=detections)

    def _iter_tiles(self, image: Image.Image):
        width, height = image.size
        if self.tile_size == 0 or (width <= self.tile_size and height <= self.tile_size):
            yield 0, 0, image
            return

        for top in range(0, height, self.tile_size):
            for left in range(0, width, self.tile_size):
                right = min(left + self.tile_size, width)
                bottom = min(top + self.tile_size, height)
                yield left, top, image.crop((left, top, right, bottom))

    def _predict_tile(
        self,
        tile: Image.Image,
        score_threshold: float,
    ) -> list[tuple[float, float, float]]:
        tensor = self.transform(tile).unsqueeze(0).to(self.device)

        with torch.no_grad():
            outputs = self.model(tensor)

        scores = functional.softmax(outputs["pred_logits"], -1)[:, :, 1][0]
        points = outputs["pred_points"][0]
        keep = scores > score_threshold

        return [
            (float(point[0]), float(point[1]), float(score))
            for point, score in zip(points[keep].detach().cpu(), scores[keep].detach().cpu())
        ]

    def _load_model(self, weight_path: Path) -> torch.nn.Module:
        if not weight_path.exists():
            logger.error("model_weight_not_found path={}", weight_path)
            raise FileNotFoundError(f"P2PNet weight file not found: {weight_path}")

        logger.debug("model_weight_loading path={} bytes={}", weight_path, weight_path.stat().st_size)
        args = SimpleNamespace(backbone="vgg16_bn", row=2, line=2)
        model = build_model(args, training=False)
        checkpoint = torch.load(weight_path, map_location="cpu")
        model.load_state_dict(checkpoint["model"])
        model.to(self.device)
        model.eval()
        logger.debug("model_weight_loaded path={}", weight_path)
        return model

    def _load_image(self, image_bytes: bytes) -> PreparedImage:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        width, height = image.size
        logger.debug("image_decoded width={} height={}", width, height)

        if width < SIZE_STEP or height < SIZE_STEP:
            logger.warning("image_rejected_too_small width={} height={}", width, height)
            raise ValueError(f"Image must be at least {SIZE_STEP}x{SIZE_STEP} pixels")

        # Sem teto, fotos de milhares de pixels estouram o tempo do VGG16 em CPU.
        shrink = min(1.0, self.max_side / max(width, height)) if self.max_side else 1.0
        resized_width = max(SIZE_STEP, int(width * shrink) // SIZE_STEP * SIZE_STEP)
        resized_height = max(SIZE_STEP, int(height * shrink) // SIZE_STEP * SIZE_STEP)
        logger.debug(
            "image_resize source={}x{} target={}x{} shrink={:.4f}",
            width,
            height,
            resized_width,
            resized_height,
            shrink,
        )

        return PreparedImage(
            image=image.resize(
                (resized_width, resized_height),
                Image.Resampling.LANCZOS,
            ),
            scale_x=width / resized_width,
            scale_y=height / resized_height,
        )
