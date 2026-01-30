import { NextRequest, NextResponse } from 'next/server';
import { ClickUpClient, getClickUpClient, CLICKUP_PRIORITY_MAP, PRIORITY_FROM_CLICKUP } from '@/lib/integrations/clickup';
import { getAuthContext, unauthorizedResponse } from '@/lib/api/auth';
import { getOAuthAccessToken } from '@/lib/integrations/user-credentials';

/**
 * Get a ClickUp client for the authenticated user
 * First tries user's stored credentials, then falls back to global env var
 */
async function getClientForUser(
  tenantId: string,
  userId: string
): Promise<{ client: ClickUpClient; mode: "oauth" | "env" } | null> {
  // Try user's stored OAuth token first
  const accessToken = await getOAuthAccessToken(tenantId, userId, "clickup");
  if (accessToken) {
    return { client: new ClickUpClient({ apiKey: accessToken }), mode: "oauth" };
  }

  // Env fallback is DEMO_MODE only (never in production).
  if (process.env.DEMO_MODE === "true") {
    const envClient = getClickUpClient();
    if (envClient) return { client: envClient, mode: "env" };
  }
  return null;
}

// GET /api/clickup - Get ClickUp tasks or sync status
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);
  const { user, tenantId } = context;

  const clientResult = await getClientForUser(tenantId, user.id);
  
  if (!clientResult) {
    return NextResponse.json({
      success: false,
      error: 'ClickUp not connected. Connect via Settings page.',
      connected: false,
    });
  }
  const { client, mode } = clientResult;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'workspaces': {
        const result = await client.getWorkspaces();
        return NextResponse.json({
          success: true,
          data: result.teams,
          connected: true,
        });
      }

      case 'spaces': {
        const teamId = searchParams.get('team_id');
        if (!teamId) {
          return NextResponse.json(
            { success: false, error: 'team_id is required' },
            { status: 400 }
          );
        }
        const result = await client.getSpaces(teamId);
        return NextResponse.json({
          success: true,
          data: result.spaces,
          connected: true,
        });
      }

      case 'folders': {
        const spaceId = searchParams.get('space_id');
        if (!spaceId) {
          return NextResponse.json(
            { success: false, error: 'space_id is required' },
            { status: 400 }
          );
        }
        const result = await client.getFolders(spaceId);
        return NextResponse.json({
          success: true,
          data: result.folders,
          connected: true,
        });
      }

      case 'lists': {
        const folderId = searchParams.get('folder_id');
        if (!folderId) {
          return NextResponse.json(
            { success: false, error: 'folder_id is required' },
            { status: 400 }
          );
        }
        const result = await client.getLists(folderId);
        return NextResponse.json({
          success: true,
          data: result.lists,
          connected: true,
        });
      }

      case 'tasks': {
        const listId = searchParams.get('list_id');
        if (!listId) {
          return NextResponse.json(
            { success: false, error: 'list_id is required' },
            { status: 400 }
          );
        }
        const result = await client.getTasks(listId, { include_closed: true });
        
        // Convert to our format
        const tasks = result.tasks.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description,
          status: task.status.status,
          priority: task.priority ? (PRIORITY_FROM_CLICKUP[task.priority.priority as unknown as keyof typeof PRIORITY_FROM_CLICKUP] || 'medium') : 'medium',
          due_date: task.due_date,
          clickup_id: task.id,
          list_name: task.list.name,
          space_name: task.space.name,
        }));

        return NextResponse.json({
          success: true,
          data: tasks,
          connected: true,
        });
      }

      case 'status': {
        // Just check if we can connect
        const result = await client.getWorkspaces();
        return NextResponse.json({
          success: true,
          connected: true,
          workspaces: result.teams.length,
          mode,
        });
      }

      default:
        return NextResponse.json({
          success: true,
          connected: true,
          message: 'ClickUp integration is configured. Use action parameter: workspaces, spaces, tasks, status',
        });
    }
  } catch (error) {
    console.error('ClickUp API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to ClickUp',
      connected: false,
    });
  }
}

// POST /api/clickup - Create or update ClickUp tasks
export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);
  const { user, tenantId } = context;

  const clientResult = await getClientForUser(tenantId, user.id);
  
  if (!clientResult) {
    return NextResponse.json({
      success: false,
      error: 'ClickUp not connected',
    }, { status: 400 });
  }
  const { client } = clientResult;

  try {
    const body = await request.json();
    const { action, listId, taskId, data } = body;

    switch (action) {
      case 'create_task': {
        if (!listId || !data?.name) {
          return NextResponse.json(
            { success: false, error: 'listId and data.name are required' },
            { status: 400 }
          );
        }

        const task = await client.createTask(listId, {
          name: data.name,
          description: data.description,
          priority: data.priority ? CLICKUP_PRIORITY_MAP[data.priority as keyof typeof CLICKUP_PRIORITY_MAP] : undefined,
          due_date: data.due_date ? new Date(data.due_date).getTime() : undefined,
          status: data.status,
        });

        return NextResponse.json({
          success: true,
          data: task,
        });
      }

      case 'update_task': {
        if (!taskId) {
          return NextResponse.json(
            { success: false, error: 'taskId is required' },
            { status: 400 }
          );
        }

        const task = await client.updateTask(taskId, {
          name: data?.name,
          description: data?.description,
          priority: data?.priority ? CLICKUP_PRIORITY_MAP[data.priority as keyof typeof CLICKUP_PRIORITY_MAP] : undefined,
          due_date: data?.due_date ? new Date(data.due_date).getTime() : undefined,
          status: data?.status,
        });

        return NextResponse.json({
          success: true,
          data: task,
        });
      }

      case 'add_comment': {
        if (!taskId || !data?.comment) {
          return NextResponse.json(
            { success: false, error: 'taskId and data.comment are required' },
            { status: 400 }
          );
        }

        const comment = await client.addTaskComment(taskId, data.comment);
        return NextResponse.json({
          success: true,
          data: comment,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('ClickUp API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform ClickUp action',
    }, { status: 500 });
  }
}
