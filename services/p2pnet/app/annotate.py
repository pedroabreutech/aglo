from __future__ import annotations

import base64
from io import BytesIO

from PIL import Image, ImageDraw, ImageFont
from loguru import logger

POINT_RADIUS = 4
POINT_FILL = (255, 56, 56)
POINT_OUTLINE = (255, 230, 80)
LABEL_PADDING = 8


def build_annotated_image_base64(
    image_bytes: bytes,
    points: list[list[float]],
    content_type: str,
) -> str:
    logger.debug("annotation_started points={} content_type={} bytes={}", len(points), content_type, len(image_bytes))
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    draw = ImageDraw.Draw(image)

    for x, y in points:
        left = x - POINT_RADIUS
        top = y - POINT_RADIUS
        right = x + POINT_RADIUS
        bottom = y + POINT_RADIUS
        draw.ellipse(
            (left, top, right, bottom),
            fill=POINT_FILL,
            outline=POINT_OUTLINE,
            width=1,
        )

    draw_count_label(draw, len(points))
    encoded = encode_image_base64(image, content_type)
    logger.debug("annotation_completed points={} encoded_bytes={}", len(points), len(encoded))
    return encoded


def draw_count_label(draw: ImageDraw.ImageDraw, total: int) -> None:
    label = f"Total: {total}"
    font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), label, font=font)
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]

    background = (
        LABEL_PADDING,
        LABEL_PADDING,
        LABEL_PADDING * 3 + width,
        LABEL_PADDING * 3 + height,
    )
    text_position = (LABEL_PADDING * 2, LABEL_PADDING * 2)

    draw.rectangle(background, fill=(0, 0, 0), outline=(255, 255, 255), width=1)
    draw.text(text_position, label, fill=(255, 255, 255), font=font)


def encode_image_base64(image: Image.Image, content_type: str) -> str:
    output = BytesIO()
    image.save(output, format=image_format(content_type), quality=90)
    return base64.b64encode(output.getvalue()).decode("ascii")


def image_format(content_type: str) -> str:
    if content_type == "image/png":
        return "PNG"
    if content_type == "image/webp":
        return "WEBP"
    return "JPEG"
