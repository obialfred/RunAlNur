import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";

// GET /api/approvals - List approvals
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { tenantId, supabase } = context;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  let query = supabase.from("approvals").select("*").eq("tenant_id", tenantId);
  if (status) query = query.eq("status", status);

  const { data, error: dbError } = await query.order("created_at", { ascending: false });
  
  if (dbError) {
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: data || [] });
}

// POST /api/approvals - Create an approval request
export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    
    const insertData = {
      tenant_id: tenantId,
      entity_type: body.entity_type,
      entity_id: body.entity_id || null,
      action: body.action,
      status: "pending", // Always start as pending
      requester_id: user.id, // Always use authenticated user as requester
      approver_id: null,
      notes: body.reason || null,
      metadata: body.metadata || null,
    };

    const { data, error: insertError } = await supabase
      .from("approvals")
      .insert(insertData as never)
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Error creating approval:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create approval request" },
      { status: 500 }
    );
  }
}

// PATCH /api/approvals - Update approval status (approve/reject)
export async function PATCH(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { id, status } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Approval ID is required" },
        { status: 400 }
      );
    }

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    // Check if user can approve (for now, any authenticated user can approve)
    // In production, add role-based checks here
    
    const { data, error: updateError } = await supabase
      .from("approvals")
      .update({ 
        status, 
        approver_id: user.id,
        updated_at: new Date().toISOString(),
      } as never)
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

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Error updating approval:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update approval" },
      { status: 500 }
    );
  }
}
