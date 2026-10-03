import sharp from "sharp";
import type { DetectionPoint } from "./reportMetrics.service";

/** Mesmo estilo visual do P2Pnet (`annotate.py`). */
const POINT_RADIUS = 4;
const POINT_FILL = "#FF3838";
const POINT_OUTLINE = "#FFE650";

/**
 * Desenha todos os pontos (originais + reforço) sobre a imagem original.
 * Retorna PNG em buffer para upload como imagem processada.
 */
export async function annotateImageBufferWithPoints(
  imageBuffer: Buffer,
  points: DetectionPoint[],
): Promise<{
  buffer: Buffer;
  contentType: string;
  extension: string;
  byteSize: number;
}> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (width <= 0 || height <= 0) {
    throw new Error(
      "Não foi possível ler as dimensões da imagem para anotação.",
    );
  }

  const circles = points
    .map((point) => {
      const cx = Math.max(0, Math.min(width - 1, point.x));
      const cy = Math.max(0, Math.min(height - 1, point.y));
      return `<circle cx="${cx}" cy="${cy}" r="${POINT_RADIUS}" fill="${POINT_FILL}" stroke="${POINT_OUTLINE}" stroke-width="1" />`;
    })
    .join("");

  const label = `Total: ${points.length}`;
  const labelSvg = `
    <rect x="8" y="8" width="${Math.max(80, 12 + label.length * 7)}" height="28" fill="#000000" stroke="#ffffff" stroke-width="1" />
    <text x="16" y="27" fill="#ffffff" font-size="14" font-family="sans-serif">${label}</text>
  `;

  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${circles}${labelSvg}</svg>`,
  );

  const buffer = await image
    .composite([{ input: svg, top: 0, left: 0 }])
    .png()
    .toBuffer();

  return {
    buffer,
    contentType: "image/png",
    extension: "png",
    byteSize: buffer.length,
  };
}
