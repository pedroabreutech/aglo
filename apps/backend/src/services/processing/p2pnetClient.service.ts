import { env } from "../../config/env";
import {
  IP2PNetClient,
  P2PNetPredictionResult,
} from "../../domain/interfaces/services/IP2PNetClient";
import { ProcessingFailedException } from "../../exceptions/processingFailed.exception";
import { createLogger } from "../../utils/logger";

const logger = createLogger("P2PNetClientService");

type P2PNetPayload = Record<string, unknown>;

const COUNT_FIELDS = [
  "estimatedCount",
  "estimated_count",
  "count",
  "total",
  "people",
  "estimate",
  "value",
] as const;

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function readEstimatedCount(payload: P2PNetPayload): number | undefined {
  for (const field of COUNT_FIELDS) {
    const parsed = parseNumber(payload[field]);

    if (parsed !== undefined) {
      return Math.round(parsed);
    }
  }

  return Array.isArray(payload.points) ? payload.points.length : undefined;
}

function readAnnotatedImage(payload: P2PNetPayload): string | undefined {
  const value = payload.annotated_image_base64 ?? payload.annotatedImageBase64;

  return typeof value === "string" && value.trim() ? value : undefined;
}

function normalizeResponse(rawResponse: unknown): P2PNetPredictionResult {
  if (
    !rawResponse ||
    typeof rawResponse !== "object" ||
    Array.isArray(rawResponse)
  ) {
    throw new ProcessingFailedException("Invalid response from P2Pnet");
  }

  const payload = rawResponse as P2PNetPayload;
  const estimatedCount = readEstimatedCount(payload);

  if (estimatedCount === undefined) {
    throw new ProcessingFailedException(
      "P2Pnet response did not include an estimated count",
    );
  }

  return {
    estimatedCount,
    annotatedImageBase64: readAnnotatedImage(payload),
    rawResponse,
  };
}

/** undici esconde o motivo real (ECONNRESET, ECONNREFUSED...) em `error.cause`. */
function describeCause(error: unknown): string | undefined {
  const cause =
    error instanceof Error ? (error as { cause?: unknown }).cause : undefined;

  if (!cause || typeof cause !== "object") {
    return undefined;
  }

  const { code, message } = cause as { code?: unknown; message?: unknown };
  const parts = [code, message].filter(
    (part): part is string => typeof part === "string" && part.length > 0,
  );

  return parts.length > 0 ? parts.join(": ") : undefined;
}

export class P2PNetClientService implements IP2PNetClient {
  constructor(
    private readonly baseUrl: string = env.p2pnet.baseUrl,
    private readonly timeoutMs: number = env.p2pnet.timeoutMs,
  ) {}

  public async predict(params: {
    imageBuffer: Buffer;
    contentType: string;
    threshold: number;
    weightPath: string;
  }): Promise<P2PNetPredictionResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(
        `${this.baseUrl.replace(/\/$/, "")}/predict`,
        {
          method: "POST",
          body: this.buildFormData(params),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const details = await response.text();
        throw new ProcessingFailedException(
          `P2Pnet returned ${response.status}: ${details || response.statusText}`,
        );
      }

      return normalizeResponse(await response.json());
    } catch (error) {
      if (error instanceof ProcessingFailedException) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new ProcessingFailedException("P2Pnet request timed out");
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      const cause = describeCause(error);

      logger.error("p2pnet_call_failed", error, {
        baseUrl: this.baseUrl,
        imageBytes: params.imageBuffer.length,
        contentType: params.contentType,
        cause,
      });

      throw new ProcessingFailedException(
        `Failed to call P2Pnet: ${message}${cause ? ` (${cause})` : ""}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildFormData(params: {
    imageBuffer: Buffer;
    contentType: string;
    threshold: number;
    weightPath: string;
  }): FormData {
    const formData = new FormData();

    formData.append(
      "file",
      new Blob([new Uint8Array(params.imageBuffer)], {
        type: params.contentType,
      }),
      "image",
    );
    formData.append("threshold", String(params.threshold));
    formData.append("weight_path", params.weightPath);

    return formData;
  }
}
