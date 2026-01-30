import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/api/auth';
import { logEvent } from "@/lib/events/emitter";
import { getProjects, sampleProjects } from "@/lib/data/store";

interface ProjectRow {
  id: string;
  arm_id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  clickup_id: string | null;
  due_date: string | null;
  progress: number;
  tasks_total: number;
  tasks_completed: number;
  created_at: string;
  updated_at: string;
  owner_id?: string;
}

// GET /api/projects - List all projects for authenticated user
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  const { searchParams } = new URL(request.url);
  const armId = searchParams.get('arm_id');
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');

  const demoMode = process.env.DEMO_MODE === "true";

  if (!supabase) {
    if (!demoMode) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
    }
    // Demo-mode fallback: in-memory store (useful when user has no Supabase)
    let projects = getProjects();
    if (armId) projects = projects.filter((p) => p.arm_id === armId);
    if (status) projects = projects.filter((p) => p.status === status);
    if (priority) projects = projects.filter((p) => p.priority === priority);
    return NextResponse.json({ success: true, data: projects, total: projects.length });
  }

  // Build query with user scoping
  let query = supabase
    .from('projects')
    .select('*')
    .eq("tenant_id", tenantId)
    .eq("owner_id", user.id);
  
  if (armId) query = query.eq('arm_id', armId);
  if (status) query = query.eq('status', status);
  if (priority) query = query.eq('priority', priority);

  const { data, error: dbError } = await query.order('created_at', { ascending: false });
  
  if (dbError) {
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: data || [],
    total: data?.length || 0,
  });
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  try {
    const body = await request.json();
    const { name, description, arm_id, priority, due_date } = body;

    if (!name || !arm_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and arm_id are required',
          // Dev-only debug to unblock UI audit (helps identify mismatched payload keys)
          debug: process.env.NODE_ENV === "development"
            ? { receivedKeys: Object.keys(body || {}), received: body }
            : undefined,
        },
        { status: 400 }
      );
    }

    const demoMode = process.env.DEMO_MODE === "true";

    if (!supabase) {
      if (!demoMode) {
        return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
      }
      // Demo-mode fallback: in-memory store
      const newProject = {
        id: Date.now().toString(),
        arm_id,
        name,
        description: description || "",
        status: "planning",
        priority: priority || "medium",
        clickup_id: null,
        due_date: due_date || null,
        progress: 0,
        tasks_total: 0,
        tasks_completed: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_id: user.id,
      };
      sampleProjects.push(newProject as unknown as (typeof sampleProjects)[number]);
      await logEvent({
        type: "project_created",
        description: `Created project "${newProject.name}"`,
        arm_id: newProject.arm_id,
        project_id: newProject.id,
      });
      return NextResponse.json({ success: true, data: newProject });
    }

    const insertData = {
      tenant_id: tenantId,
      arm_id,
      name,
      description: description || '',
      status: 'planning',
      priority: priority || 'medium',
      due_date: due_date || null,
      progress: 0,
      tasks_total: 0,
      tasks_completed: 0,
      owner_id: user.id, // Associate with authenticated user
    };

    const { data, error: dbError } = await supabase
      .from('projects')
      .insert(insertData as never)
      .select('*')
      .single();

    if (dbError) {
      return NextResponse.json(
        { success: false, error: dbError.message },
        { status: 500 }
      );
    }

    const row = data as ProjectRow;
    await logEvent({
      type: "project_created",
      description: `Created project "${row.name}"`,
      arm_id: row.arm_id,
      project_id: row.id,
    });

    return NextResponse.json({
      success: true,
      data: row,
    });
  } catch (err) {
    console.error('Error creating project:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
