import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

const s3Client = new S3Client({
  region: env.s3.region,
  endpoint: env.s3.endpoint,
  credentials:
    env.s3.accessKeyId && env.s3.secretAccessKey
      ? {
          accessKeyId: env.s3.accessKeyId,
          secretAccessKey: env.s3.secretAccessKey,
        }
      : undefined,
  forcePathStyle: true,
});

export { s3Client };
