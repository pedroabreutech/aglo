import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { env } from "../../config/env";
import { s3Client } from "../../config/gcs";
import { IStorageService } from "../../domain/interfaces/services/IStorageService";
import { GlobalErrorException } from "../../exceptions/globalError.exception";
import { HttpStatus } from "../../utils/httpStatus";

interface GcsStorageServiceParams {
  storage?: S3Client;
  bucketName?: string;
  signedUrlTtlSeconds?: number;
}

export class GcsStorageService implements IStorageService {
  private readonly storage: S3Client;
  private readonly bucketName: string;
  private readonly signedUrlTtlSeconds: number;

  constructor(params: GcsStorageServiceParams = {}) {
    this.storage = params.storage || s3Client;
    this.bucketName = params.bucketName || env.s3.bucketName;
    this.signedUrlTtlSeconds =
      params.signedUrlTtlSeconds || env.s3.signedUrlTtlSeconds;
  }

  public async upload(params: {
    objectKey: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<void> {
    await this.storage.send(
      new PutObjectCommand({
        Bucket: this.getBucketName(),
        Key: params.objectKey,
        Body: params.buffer,
        ContentType: params.contentType,
        ContentLength: params.buffer.length,
      }),
    );
  }

  public async download(objectKey: string): Promise<Buffer> {
    const response = await this.storage.send(
      new GetObjectCommand({
        Bucket: this.getBucketName(),
        Key: objectKey,
      }),
    );

    if (!response.Body) {
      return Buffer.alloc(0);
    }

    return streamToBuffer(response.Body);
  }

  public async getSignedReadUrl(objectKey: string): Promise<string> {
    return getSignedUrl(
      this.storage,
      new GetObjectCommand({
        Bucket: this.getBucketName(),
        Key: objectKey,
      }),
      { expiresIn: this.signedUrlTtlSeconds },
    );
  }

  public async delete(objectKey: string): Promise<void> {
    try {
      await this.storage.send(
        new DeleteObjectCommand({
          Bucket: this.getBucketName(),
          Key: objectKey,
        }),
      );
    } catch (error) {
      if (isObjectNotFoundError(error)) {
        return;
      }

      throw error;
    }
  }

  private getBucketName() {
    if (!this.bucketName) {
      throw new GlobalErrorException(
        "S3_BUCKET is required to use storage",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return this.bucketName;
  }
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (body instanceof Readable) {
    const chunks: Buffer[] = [];

    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }

  if (
    body &&
    typeof body === "object" &&
    "transformToByteArray" in body &&
    typeof body.transformToByteArray === "function"
  ) {
    return Buffer.from(await body.transformToByteArray());
  }

  throw new GlobalErrorException(
    "Unsupported S3 response body type",
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
}

function isObjectNotFoundError(error: unknown) {
  if (error instanceof NoSuchKey) {
    return true;
  }

  return (
    error instanceof S3ServiceException &&
    (error.name === "NoSuchKey" || error.$metadata.httpStatusCode === 404)
  );
}
