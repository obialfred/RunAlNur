import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from "@/lib/api/auth";

// GET /api/profile - Get current user's profile (or specific user for admins)
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get("user_id");

  // If requesting another user's profile, must be admin
  const targetUserId = requestedUserId || user.id;
  if (requestedUserId && requestedUserId !== user.id) {
    // Only admins can view other users' profiles
    if (user.role !== "admin") {
      return forbiddenResponse("Cannot view other users' profiles");
    }
  }

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  const { data, error: dbError } = await supabase
    .from("profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", targetUserId)
    .single();

  if (dbError) {
    // If profile doesn't exist, return empty profile with user id
    if (dbError.code === "PGRST116") {
      return NextResponse.json({
        success: true,
        data: { id: targetUserId, role: "member", arm_access: [] },
      });
    }
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { id, role, arm_access, email, name, avatar_url, title, tenant_id } = body;

  // Determine target user
  const targetUserId = id || user.id;

  // SECURITY: Prevent privilege escalation
  // Users can only update their own profile, and cannot change their own role/arm_access
  if (targetUserId !== user.id) {
    // Only admins can update other users' profiles
    if (user.role !== "admin") {
      return forbiddenResponse("Cannot update other users' profiles");
    }
  } else {
    // Users updating their own profile cannot change role or arm_access
    if (role !== undefined || arm_access !== undefined) {
      if (user.role !== "admin") {
        return forbiddenResponse("Cannot modify your own role or access permissions");
      }
    }
  }

  // Build safe update data
  const updateData: Record<string, unknown> = {
    id: targetUserId,
    tenant_id: tenantId,
    updated_at: new Date().toISOString(),
  };

  // Allow these fields for self-update
  if (email !== undefined) updateData.email = email;
  if (name !== undefined) updateData.name = name;
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
  if (title !== undefined) updateData.title = title;

  // Only admins can set these fields
  if (user.role === "admin") {
    if (role !== undefined) updateData.role = role;
    if (arm_access !== undefined) updateData.arm_access = arm_access;
  }

  const { data, error: dbError } = await supabase
    .from("profiles")
    .upsert(updateData as never)
    .select("*")
    .single();

  if (dbError) {
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}
