import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Verify ClickUp webhook signature
 * ClickUp uses HMAC-SHA256 with the webhook secret
 */
export async function verifyClickUpWebhook(
  request: NextRequest,
  body: string
): Promise<{ valid: boolean; error?: string }> {
  const secret = process.env.CLICKUP_WEBHOOK_SECRET;
  
  if (!secret) {
    // If no secret configured, log warning and reject in production
    if (process.env.NODE_ENV === "production") {
      console.error("CLICKUP_WEBHOOK_SECRET not configured - rejecting webhook");
      return { valid: false, error: "Webhook secret not configured" };
    }
    // In development, allow through with warning
    console.warn("CLICKUP_WEBHOOK_SECRET not configured - allowing in development");
    return { valid: true };
  }

  const signature = request.headers.get("x-signature");
  
  if (!signature) {
    return { valid: false, error: "Missing signature header" };
  }

  try {
    const expectedSignature = createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: "Invalid signature" };
    }

    const valid = timingSafeEqual(signatureBuffer, expectedBuffer);
    return { valid, error: valid ? undefined : "Invalid signature" };
  } catch {
    return { valid: false, error: "Signature verification failed" };
  }
}

/**
 * Verify Process Street webhook signature
 * Process Street uses HMAC-SHA256
 */
export async function verifyProcessStreetWebhook(
  request: NextRequest,
  body: string
): Promise<{ valid: boolean; error?: string }> {
  const secret = process.env.PROCESS_STREET_WEBHOOK_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("PROCESS_STREET_WEBHOOK_SECRET not configured - rejecting webhook");
      return { valid: false, error: "Webhook secret not configured" };
    }
    console.warn("PROCESS_STREET_WEBHOOK_SECRET not configured - allowing in development");
    return { valid: true };
  }

  const signature = request.headers.get("x-process-street-signature") || 
                    request.headers.get("x-signature");
  
  if (!signature) {
    return { valid: false, error: "Missing signature header" };
  }

  try {
    const expectedSignature = createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: "Invalid signature" };
    }

    const valid = timingSafeEqual(signatureBuffer, expectedBuffer);
    return { valid, error: valid ? undefined : "Invalid signature" };
  } catch {
    return { valid: false, error: "Signature verification failed" };
  }
}

/**
 * Verify generic incoming webhook with shared secret
 */
export async function verifyIncomingWebhook(
  request: NextRequest
): Promise<{ valid: boolean; error?: string }> {
  const secret = process.env.WEBHOOK_SHARED_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("WEBHOOK_SHARED_SECRET not configured - rejecting webhook");
      return { valid: false, error: "Webhook secret not configured" };
    }
    console.warn("WEBHOOK_SHARED_SECRET not configured - allowing in development");
    return { valid: true };
  }

  // Check for secret in header or query param
  const headerSecret = request.headers.get("x-webhook-secret") || 
                       request.headers.get("authorization")?.replace("Bearer ", "");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");

  const providedSecret = headerSecret || querySecret;

  if (!providedSecret) {
    return { valid: false, error: "Missing webhook secret" };
  }

  // Timing-safe comparison
  try {
    const secretBuffer = Buffer.from(secret);
    const providedBuffer = Buffer.from(providedSecret);

    if (secretBuffer.length !== providedBuffer.length) {
      return { valid: false, error: "Invalid secret" };
    }

    const valid = timingSafeEqual(secretBuffer, providedBuffer);
    return { valid, error: valid ? undefined : "Invalid secret" };
  } catch {
    return { valid: false, error: "Secret verification failed" };
  }
}

/**
 * Create a webhook verification failed response
 */
export function webhookUnauthorizedResponse(error = "Webhook verification failed"): NextResponse {
  return NextResponse.json(
    { success: false, error },
    { status: 401 }
  );
}
