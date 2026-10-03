import dotenv from "dotenv";

dotenv.config();

const REQUIRED_ENVS = [
  "PORT",
  "NODE_ENV",
  "CORS_ALLOWED_ORIGINS",
  "DATABASE_URL",
  "MANAGEMENT_PORT",
] as const;

const missingEnvs = REQUIRED_ENVS.filter((env) => !process.env[env]);

if (missingEnvs.length > 0) {
  console.error(
    `Missing required environment variables: ${missingEnvs.join(", ")}`,
  );
  process.exit(1);
}

export const env = {
  app: {
    port: Number(process.env.PORT),
    environment: process.env.NODE_ENV,
    managementPort: Number(process.env.MANAGEMENT_PORT),
    publicUrl: process.env.APP_PUBLIC_URL,
  },
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(",") || [],
  },
  db: {
    url: process.env.DATABASE_URL,
  },
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    region: process.env.AWS_REGION || "br-se1",
    endpoint: process.env.AWS_ENDPOINT_URL || undefined,
    bucketName: process.env.S3_BUCKET || "",
    signedUrlTtlSeconds: Number(
      process.env.STORAGE_SIGNED_URL_TTL_SECONDS || 900,
    ),
  },
  p2pnet: {
    baseUrl: process.env.P2PNET_BASE_URL || "http://127.0.0.1:8001",
    timeoutMs: Number(process.env.P2PNET_TIMEOUT_MS || 300000),
    defaultThreshold: Number(process.env.P2PNET_DEFAULT_THRESHOLD || 0.5),
    defaultWeightPath:
      process.env.P2PNET_DEFAULT_WEIGHT_PATH || "./weights/SHTechA.pth",
  },
} as const;
