import { NextRequest, NextResponse } from "next/server";
import { verifyIncomingWebhook, webhookUnauthorizedResponse } from "@/lib/api/webhooks";
import { logEvent } from "@/lib/events/emitter";

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const verification = await verifyIncomingWebhook(request);
  
  if (!verification.valid) {
    console.error("Incoming webhook verification failed:", verification.error);
    return webhookUnauthorizedResponse(verification.error);
  }

  try {
    const payload = await request.json();

    // Validate payload structure
    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    // Log the event
    await logEvent({
      type: payload.type || "webhook_received",
      description: payload.description || "Incoming webhook event",
      arm_id: payload.arm_id || null,
      project_id: payload.project_id || null,
      contact_id: payload.contact_id || null,
      metadata: {
        source: "incoming_webhook",
        timestamp: new Date().toISOString(),
        // Only store safe fields from payload
        type: payload.type,
        reference: payload.reference,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Incoming webhook processing error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
