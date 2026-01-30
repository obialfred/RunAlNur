/**
 * Single Media Asset API
 * 
 * GET /api/media/[id] - Get media asset details
 * PATCH /api/media/[id] - Update media asset
 * DELETE /api/media/[id] - Soft delete media asset
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse, badRequestResponse } from "@/lib/api/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/media/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { tenantId, supabase } = context;
  const { id } = await params;

  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
  }

  const { data, error: dbError } = await supabase
    .from("media_assets")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .neq("status", "deleted")
    .single();

  if (dbError || !data) {
    return NextResponse.json({ success: false, error: "Media not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}

// PATCH /api/media/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { tenantId, supabase } = context;
  const { id } = await params;

  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    
    // Allowed update fields
    const allowedFields = [
      "title",
      "description",
      "manual_tags",
      "entity_id",
      "collection_id",
      "location_name",
      "shot_date",
      "photographer",
      "is_favorite",
      "is_brand_asset",
      "status",
    ];
    
    // Filter to only allowed fields
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return badRequestResponse("No valid fields to update");
    }

    const { data, error: updateError } = await supabase
      .from("media_assets")
      .update(updateData as never)
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .neq("status", "deleted")
      .select("*")
      .single();

    if (updateError) {
      console.error("Error updating media:", updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ success: false, error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Error updating media:", err);
    return NextResponse.json({ success: false, error: "Failed to update media" }, { status: 500 });
  }
}

// DELETE /api/media/[id] - Soft delete
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { tenantId, supabase } = context;
  const { id } = await params;

  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
  }

  try {
    // Soft delete: set status to 'deleted' and archived_at
    const { error: deleteError } = await supabase
      .from("media_assets")
      .update({
        status: "deleted",
        archived_at: new Date().toISOString(),
      } as never)
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting media:", deleteError);
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting media:", err);
    return NextResponse.json({ success: false, error: "Failed to delete media" }, { status: 500 });
  }
}
