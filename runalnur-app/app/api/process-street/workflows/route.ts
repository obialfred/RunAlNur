import { NextRequest, NextResponse } from "next/server";
import { getProcessStreetClient, ProcessStreetClient } from "@/lib/integrations/process-street";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { getApiKey } from "@/lib/integrations/user-credentials";

// GET /api/process-street/workflows - Get Process Street workflows
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);

  const apiKey = await getApiKey(context.tenantId, context.user.id, "process_street");
  const client = apiKey
    ? new ProcessStreetClient({ apiKey })
    : process.env.DEMO_MODE === "true"
      ? getProcessStreetClient()
      : null;
  if (!client) {
    return NextResponse.json(
      { success: false, error: "Process Street not connected. Connect via Settings page." },
      { status: 400 }
    );
  }

  try {
    const data = await client.getWorkflows();
    return NextResponse.json({ success: true, data: data.workflows });
  } catch (error) {
    console.error("Process Street workflows error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}
