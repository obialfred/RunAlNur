import { NextRequest, NextResponse } from "next/server";
import { getProcessStreetClient, ProcessStreetClient } from "@/lib/integrations/process-street";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { getApiKey } from "@/lib/integrations/user-credentials";

// GET /api/process-street/runs - Get workflow runs
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);
  const { user, tenantId } = context;

  const { searchParams } = new URL(request.url);
  const workflowId = searchParams.get("workflow_id");
  if (!workflowId) {
    return NextResponse.json({ success: false, error: "workflow_id is required" }, { status: 400 });
  }

  const apiKey = await getApiKey(tenantId, user.id, "process_street");
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
    const data = await client.getWorkflowRuns(workflowId);
    return NextResponse.json({ success: true, data: data.workflow_runs });
  } catch (error) {
    console.error("Process Street runs error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch workflow runs" },
      { status: 500 }
    );
  }
}

// POST /api/process-street/runs - Create a workflow run
export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);
  const { user, tenantId } = context;

  const body = await request.json();
  const { workflow_id, name, assignee_email } = body;

  if (!workflow_id || !name) {
    return NextResponse.json(
      { success: false, error: "workflow_id and name are required" },
      { status: 400 }
    );
  }

  const apiKey = await getApiKey(tenantId, user.id, "process_street");
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
    const data = await client.createWorkflowRun(workflow_id, { name, assignee_email });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Process Street create run error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create workflow run" },
      { status: 500 }
    );
  }
}
