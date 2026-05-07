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

const enc = new TextEncoder();

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(data: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(data)));
}

async function presignPutUrl(opts: {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  key: string;
  contentType: string;
  expiresIn: number;
}): Promise<string> {
  const region = "auto";
  const service = "s3";
  const host = `${opts.accountId}.r2.cloudflarestorage.com`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const credential = `${opts.accessKeyId}/${credentialScope}`;

  const signedHeaders = "host";
  const canonicalUri = `/${opts.bucket}/${opts.key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  const params = new URLSearchParams();
  params.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
  params.set("X-Amz-Credential", credential);
  params.set("X-Amz-Date", amzDate);
  params.set("X-Amz-Expires", String(opts.expiresIn));
  params.set("X-Amz-SignedHeaders", signedHeaders);
  // Sort keys (URLSearchParams preserves insertion; we add in alpha order above)
  const canonicalQuery = params.toString();

  const canonicalRequest = [
    "PUT",
    canonicalUri,
    canonicalQuery,
    `host:${host}\n`,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = await hmac(enc.encode(`AWS4${opts.secretAccessKey}`), dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, "aws4_request");
  const signature = toHex(await hmac(kSigning, stringToSign));

  return `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

export async function createPresignedUpload(opts: {
  folder: string;
  filename: string;
  contentType: string;
}) {
  const { accountId, accessKeyId, secretAccessKey, bucket, publicUrl } = getR2Env();
  const ext = opts.filename.split(".").pop() || "bin";
  const key = `${opts.folder}/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const uploadUrl = await presignPutUrl({
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    key,
    contentType: opts.contentType,
    expiresIn: 300,
  });
  const publicBase = publicUrl.replace(/\/$/, "");
  return { uploadUrl, key, publicUrl: `${publicBase}/${key}` };
}

export async function uploadImageObject(opts: {
  folder: string;
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}) {
  const { uploadUrl, publicUrl } = await createPresignedUpload({
    folder: opts.folder,
    filename: opts.filename,
    contentType: opts.contentType,
  });

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": opts.contentType },
    body: opts.bytes,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`R2 upload failed (${response.status}): ${text || response.statusText}`);
  }

  return { publicUrl };
}