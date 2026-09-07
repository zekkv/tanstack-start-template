import { S3Client } from "bun";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
]);

/** Map validated content types to safe file extensions, preventing extension spoofing. */
const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
  "text/plain": "txt",
};

const MAX_BYTES = 10 * 1024 * 1024;

export interface UploadRequest {
  filename: string;
  contentType: string;
  size: number;
}

export function validateUploadRequest(req: UploadRequest): string | null {
  if (!ALLOWED_CONTENT_TYPES.has(req.contentType)) return "Unsupported file type";
  if (req.size > MAX_BYTES) return "File must be 10 MB or smaller";
  return null;
}

/** Derive a safe file extension from a validated content type. */
export function safeExtension(contentType: string): string {
  return CONTENT_TYPE_EXTENSIONS[contentType] ?? "bin";
}

export function createStorageClient(
  endpoint: string | undefined,
  accessKey: string | undefined,
  secretKey: string | undefined,
  bucket = "app"
): S3Client | null {
  if (!endpoint || !accessKey || !secretKey) return null;
  return new S3Client({
    endpoint,
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
    bucket,
  });
}

export function createPresignedUpload(
  client: S3Client,
  key: string,
  contentType: string,
  expiresIn = 300
): { url: string } {
  const url = client.presign(key, {
    method: "PUT",
    expiresIn,
    type: contentType,
  });
  return { url };
}
