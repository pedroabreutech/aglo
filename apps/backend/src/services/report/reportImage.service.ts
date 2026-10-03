import { randomUUID } from "crypto";
import { InvalidFileException } from "../../exceptions/invalidFile.exception";

const MAX_IMAGE_BYTES = 75 * 1024 * 1024;

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface DecodedImage {
  buffer: Buffer;
  contentType: string;
  extension: string;
  byteSize: number;
}

export function decodeImageBase64(
  imageBase64: string,
  imageName?: string,
  fallbackContentType?: string,
): DecodedImage {
  const { contentType, base64 } = splitBase64Image(imageBase64);
  const resolvedContentType =
    contentType || fallbackContentType || inferContentTypeFromName(imageName);

  if (!resolvedContentType || !EXTENSION_BY_CONTENT_TYPE[resolvedContentType]) {
    throw new InvalidFileException("Image must be JPEG, PNG or WEBP");
  }

  const buffer = Buffer.from(base64, "base64");

  if (buffer.length === 0) {
    throw new InvalidFileException("Image file is empty");
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new InvalidFileException("Image must be at most 75MB");
  }

  return {
    buffer,
    contentType: resolvedContentType,
    extension: EXTENSION_BY_CONTENT_TYPE[resolvedContentType],
    byteSize: buffer.length,
  };
}

export function buildReportObjectKey(params: {
  reportId: string;
  kind: "original" | "processed";
  extension: string;
}): string {
  return `reports/${params.reportId}/${params.kind}/${randomUUID()}.${params.extension}`;
}

function splitBase64Image(imageBase64: string): {
  contentType?: string;
  base64: string;
} {
  const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    return { base64: imageBase64 };
  }

  return {
    contentType: match[1],
    base64: match[2],
  };
}

function inferContentTypeFromName(imageName?: string): string | undefined {
  const extension = imageName?.split(".").pop()?.toLowerCase();
  return extension ? CONTENT_TYPE_BY_EXTENSION[extension] : undefined;
}
