import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api/auth";

// GET /api/notifications - List notifications for the authenticated user
export async function GET(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser(request);
  
  if (!user) {
    return unauthorizedResponse(error || "Authentication required");
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ success: true, data: [] });
  }

  // Only return notifications for the authenticated user
  const { data, error: dbError } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
    
  if (dbError) {
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: data || [] });
}

// POST /api/notifications - Create a notification
export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser(request);
  
  if (!user) {
    return unauthorizedResponse(error || "Authentication required");
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    
    // Users can only create notifications for themselves
    // (System notifications would use service role directly)
    const insertData = {
      user_id: user.id,
      title: body.title,
      message: body.body || body.message || null,
      type: body.type || "info",
      metadata: body.metadata || null,
      read: false,
    };

    const { data, error: insertError } = await supabase
      .from("notifications")
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
    console.error("Error creating notification:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark notification as read
export async function PATCH(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser(request);
  
  if (!user) {
    return unauthorizedResponse(error || "Authentication required");
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Only allow users to mark their own notifications as read
    const { data, error: updateError } = await supabase
      .from("notifications")
      .update({ read: true } as never)
      .eq("id", id)
      .eq("user_id", user.id) // Security: ensure user owns this notification
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
