import { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getR2Env() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error("R2 is not fully configured");
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

let _client: S3Client | null = null;
function getClient() {
  if (_client) return _client;
  const { accountId, accessKeyId, secretAccessKey } = getR2Env();
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

export async function createPresignedUpload(opts: {
  folder: string;
  filename: string;
  contentType: string;
}) {
  const { bucket, publicUrl } = getR2Env();
  const ext = opts.filename.split(".").pop() || "bin";
  const key = `${opts.folder}/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: opts.contentType,
  });
  const uploadUrl = await getSignedUrl(getClient(), cmd, { expiresIn: 300 });
  const publicBase = publicUrl.replace(/\/$/, "");
  return { uploadUrl, key, publicUrl: `${publicBase}/${key}` };
}