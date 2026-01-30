import { NextRequest, NextResponse } from "next/server";
import { ClickUpClient, getClickUpClient } from "@/lib/integrations/clickup";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { getOAuthAccessToken } from "@/lib/integrations/user-credentials";
import { executeClickUpSetup, previewSetup, SetupProgress } from "@/lib/clickup/setup-executor";
import { getSpecStats, HOUSE_AL_NUR_SPEC } from "@/lib/clickup/house-al-nur-spec";

/**
 * Get a ClickUp client for the authenticated user
 */
async function getClientForUser(tenantId: string, userId: string): Promise<ClickUpClient | null> {
  // Try user's stored OAuth token first
  const accessToken = await getOAuthAccessToken(tenantId, userId, "clickup");
  if (accessToken) {
    return new ClickUpClient({ apiKey: accessToken });
  }

  // Env fallback is DEMO_MODE only (never in production).
  return process.env.DEMO_MODE === "true" ? getClickUpClient() : null;
}

/**
 * GET /api/clickup/setup - Preview what would be created
 */
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);
  const { user, tenantId } = context;

  const client = await getClientForUser(tenantId, user.id);
  if (!client) {
    return NextResponse.json({
      success: false,
      error: "ClickUp not connected. Connect via Settings page.",
    }, { status: 400 });
  }

  try {
    // Get workspace ID
    const { teams } = await client.getWorkspaces();
    if (teams.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No ClickUp workspaces found",
      }, { status: 400 });
    }

    const workspaceId = teams[0].id;
    const workspaceName = teams[0].name;

    // Get spec stats
    const stats = getSpecStats();

    // Preview what would be created
    const preview = await previewSetup(client, workspaceId);

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspaceId,
        name: workspaceName,
      },
      spec: {
        spaces: HOUSE_AL_NUR_SPEC.map(s => s.name),
        totalFolders: stats.folders,
        totalLists: stats.lists,
        totalTasks: stats.tasks,
      },
      preview,
    });
  } catch (error) {
    console.error("ClickUp setup preview error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to preview setup",
    }, { status: 500 });
  }
}

/**
 * POST /api/clickup/setup - Execute the setup
 */
export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);
  const { user, tenantId } = context;

  const client = await getClientForUser(tenantId, user.id);
  if (!client) {
    return NextResponse.json({
      success: false,
      error: "ClickUp not connected. Connect via Settings page.",
    }, { status: 400 });
  }

  try {
    // Get workspace ID
    const { teams } = await client.getWorkspaces();
    if (teams.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No ClickUp workspaces found",
      }, { status: 400 });
    }

    const workspaceId = teams[0].id;

    // Execute setup
    const result = await executeClickUpSetup(client, workspaceId);

    return NextResponse.json({
      success: result.success,
      result: {
        duration: result.duration,
        created: result.progress.created,
        skipped: result.progress.skipped,
        errors: result.progress.errors,
      },
    });
  } catch (error) {
    console.error("ClickUp setup execution error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to execute setup",
    }, { status: 500 });
  }
}
