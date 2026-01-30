import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from "@/lib/api/auth";
import { logEvent } from "@/lib/events/emitter";
import { getProject, sampleProjects } from "@/lib/data/store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ProjectRecord {
  id: string;
  name: string;
  arm_id: string;
  owner_id?: string;
  [key: string]: unknown;
}

// GET /api/projects/[id] - Get single project
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  const { id } = await params;

  if (!supabase) {
    const project = getProject(id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    // Demo-mode authz best-effort: if project has owner_id, enforce it
    const ownerId = (project as unknown as { owner_id?: string }).owner_id;
    if (ownerId && ownerId !== user.id && user.role !== "admin") {
      return forbiddenResponse("You don't have access to this project");
    }
    return NextResponse.json({ success: true, data: project });
  }

  const { data, error: dbError } = await supabase
    .from("projects")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (dbError) {
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 404 }
    );
  }

  // Check ownership if owner_id exists
  const project = data as ProjectRecord;
  if (project.owner_id && project.owner_id !== user.id && user.role !== "admin") {
    return forbiddenResponse("You don't have access to this project");
  }

  return NextResponse.json({ success: true, data });
}

// PATCH /api/projects/[id] - Update project
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  const { id } = await params;
  const body = await request.json();

  if (!supabase) {
    const idx = sampleProjects.findIndex((p) => p.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    const ownerId = (sampleProjects[idx] as unknown as { owner_id?: string }).owner_id;
    if (ownerId && ownerId !== user.id && user.role !== "admin") {
      return forbiddenResponse("You don't have permission to update this project");
    }
    const updated = {
      ...(sampleProjects[idx] as unknown as Record<string, unknown>),
      ...body,
      updated_at: new Date().toISOString(),
    };
    sampleProjects[idx] = updated as unknown as (typeof sampleProjects)[number];
    await logEvent({
      type: "project_updated",
      description: `Updated project "${updated.name}"`,
      arm_id: updated.arm_id,
      project_id: updated.id,
    });
    return NextResponse.json({ success: true, data: updated });
  }

  // First check if user has access to this project
  const { data: existingData, error: fetchError } = await supabase
    .from("projects")
    .select("id, owner_id, name")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json(
      { success: false, error: "Project not found" },
      { status: 404 }
    );
  }

  const existing = existingData as ProjectRecord;

  // Check ownership
  if (existing.owner_id && existing.owner_id !== user.id && user.role !== "admin") {
    return forbiddenResponse("You don't have permission to update this project");
  }

  // Prevent changing owner_id unless admin
  const { owner_id, tenant_id, id: bodyId, ...safeBody } = body;
  
  const updateData = { 
    ...safeBody, 
    updated_at: new Date().toISOString() 
  };

  const { data, error: updateError } = await supabase
    .from("projects")
    .update(updateData as never)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json(
      { success: false, error: updateError.message },
      { status: 500 }
    );
  }

  const updatedProject = data as ProjectRecord;
  await logEvent({
    type: "project_updated",
    description: `Updated project "${updatedProject.name}"`,
    arm_id: updatedProject.arm_id,
    project_id: updatedProject.id,
  });

  return NextResponse.json({ success: true, data });
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  const { id } = await params;

  if (!supabase) {
    const idx = sampleProjects.findIndex((p) => p.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    const ownerId = (sampleProjects[idx] as unknown as { owner_id?: string }).owner_id;
    if (ownerId && ownerId !== user.id && user.role !== "admin") {
      return forbiddenResponse("You don't have permission to delete this project");
    }
    const existing = sampleProjects[idx] as unknown as { name?: string; arm_id?: string; id?: string };
    sampleProjects.splice(idx, 1);
    await logEvent({
      type: "project_deleted",
      description: `Deleted project "${existing.name}"`,
      arm_id: existing.arm_id,
      project_id: id,
    });
    return NextResponse.json({ success: true });
  }

  // First check if user has access to this project
  const { data: existingData, error: fetchError } = await supabase
    .from("projects")
    .select("id, owner_id, name, arm_id")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json(
      { success: false, error: "Project not found" },
      { status: 404 }
    );
  }

  const existing = existingData as ProjectRecord;

  // Check ownership
  if (existing.owner_id && existing.owner_id !== user.id && user.role !== "admin") {
    return forbiddenResponse("You don't have permission to delete this project");
  }

  const { error: deleteError } = await supabase
    .from("projects")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: deleteError.message },
      { status: 500 }
    );
  }

  await logEvent({
    type: "project_deleted",
    description: `Deleted project "${existing.name}"`,
    arm_id: existing.arm_id,
    project_id: id,
  });

  return NextResponse.json({ success: true });
}
