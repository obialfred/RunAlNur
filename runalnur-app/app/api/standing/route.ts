import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { getUserStanding } from "@/lib/gamification/standing";

// GET /api/standing?domain=command
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId } = context;

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain") || "command";

  try {
    const all = await getUserStanding(tenantId, user.id);
    const row = all.find((s) => s.domain === domain) || null;
    return NextResponse.json({ success: true, data: row });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

