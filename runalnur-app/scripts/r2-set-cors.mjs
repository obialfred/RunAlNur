/**
 * Configure Cloudflare R2 Bucket CORS using S3-compatible API.
 *
 * Usage:
 *   node scripts/r2-set-cors.mjs
 *
 * Requires env:
 *   CLOUDFLARE_R2_ACCESS_KEY
 *   CLOUDFLARE_R2_SECRET_KEY
 *   CLOUDFLARE_R2_BUCKET
 *   CLOUDFLARE_R2_ENDPOINT   (preferred) OR CLOUDFLARE_ACCOUNT_ID
 *
 * Optional:
 *   R2_CORS_ORIGINS="https://runalnur-app.vercel.app,https://your-domain.com"
 */

import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getEndpoint() {
  if (process.env.CLOUDFLARE_R2_ENDPOINT) return process.env.CLOUDFLARE_R2_ENDPOINT;
  const accountId = required("CLOUDFLARE_ACCOUNT_ID");
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

async function main() {
  const bucket = required("CLOUDFLARE_R2_BUCKET");
  const endpoint = getEndpoint();
  const accessKeyId = required("CLOUDFLARE_R2_ACCESS_KEY");
  const secretAccessKey = required("CLOUDFLARE_R2_SECRET_KEY");

  const origins = String(process.env.R2_CORS_ORIGINS || "https://runalnur-app.vercel.app")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  // Minimal, safe superset for presigned PUT + reads.
  const cors = {
    CORSRules: [
      {
        AllowedOrigins: origins,
        AllowedMethods: ["GET", "HEAD", "PUT"],
        AllowedHeaders: ["*"],
        ExposeHeaders: ["ETag"],
        MaxAgeSeconds: 86400,
      },
    ],
  };

  console.log("Setting CORS on bucket:", bucket);
  console.log("Endpoint:", endpoint);
  console.log("AllowedOrigins:", origins);

  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: cors,
    })
  );

  // Verify
  const verify = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
  console.log("CORS now set to:");
  console.log(JSON.stringify(verify?.CORSRules || [], null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

