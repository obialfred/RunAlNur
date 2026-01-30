import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { verifyProcessStreetWebhook, webhookUnauthorizedResponse } from "@/lib/api/webhooks";

export async function POST(request: NextRequest) {
  // Get raw body for signature verification
  const rawBody = await request.text();
  
  // Verify webhook signature
  const verification = await verifyProcessStreetWebhook(request, rawBody);
  
  if (!verification.valid) {
    console.error("Process Street webhook verification failed:", verification.error);
    return webhookUnauthorizedResponse(verification.error);
  }

  // Parse the verified payload
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    // Log the webhook event as an activity
    const insertData = {
      type: "sop_updated",
      description: `Process Street event: ${payload?.event || "update"}`,
      metadata: {
        event: payload?.event,
        workflowRunId: payload?.workflowRunId,
        taskId: payload?.taskId,
        // Don't store sensitive data
      },
    };
    
    await supabase.from("activities").insert(insertData as never);

    // Handle specific events
    if (payload?.event === "workflowRun.completed") {
      // Log workflow completion
      await supabase.from("activities").insert({
        type: "sop_completed",
        description: `Workflow run completed: ${payload?.workflowName || "Unknown"}`,
        metadata: { workflowRunId: payload?.workflowRunId },
      } as never);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Process Street webhook processing error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
