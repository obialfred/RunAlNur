import { NextRequest, NextResponse } from "next/server";
import { getProcessStreetClient, ProcessStreetClient } from "@/lib/integrations/process-street";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { getApiKey } from "@/lib/integrations/user-credentials";

export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);

  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("workflow_run_id");
  if (!runId) {
    return NextResponse.json({ success: false, error: "workflow_run_id is required" }, { status: 400 });
  }

  const apiKey = await getApiKey(context.tenantId, context.user.id, "process_street");
  const client = apiKey
    ? new ProcessStreetClient({ apiKey })
    : process.env.DEMO_MODE === "true"
      ? getProcessStreetClient()
      : null;
  if (!client) {
    return NextResponse.json({ success: false, error: "Process Street not connected" }, { status: 400 });
  }

  const data = await client.getTasks(runId);
  return NextResponse.json({ success: true, data: data.tasks });
}

export async function PATCH(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);

  const body = await request.json();
  const { task_id, status, assignee_email, form_fields } = body;

  if (!task_id) {
    return NextResponse.json({ success: false, error: "task_id is required" }, { status: 400 });
  }

  const apiKey = await getApiKey(context.tenantId, context.user.id, "process_street");
  const client = apiKey
    ? new ProcessStreetClient({ apiKey })
    : process.env.DEMO_MODE === "true"
      ? getProcessStreetClient()
      : null;
  if (!client) {
    return NextResponse.json({ success: false, error: "Process Street not connected" }, { status: 400 });
  }

  const data = await client.updateTask(task_id, {
    status,
    assignee_email,
    form_fields,
  });
  return NextResponse.json({ success: true, data });
}
