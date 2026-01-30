/**
 * Media Collections API
 * 
 * GET /api/media/collections - List collections
 * POST /api/media/collections - Create collection
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse, badRequestResponse } from "@/lib/api/auth";
import { getClientReadUrl, getStorageProvider, isR2PublicUrlConfigured } from "@/lib/media/storage";

// GET /api/media/collections
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { tenantId, supabase } = context;

  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entity_id");
  const parentId = searchParams.get("parent_id");

  let query = supabase
    .from("media_collections")
    .select(`
      *,
      cover_asset:media_assets!cover_asset_id(id, thumbnail_path, cdn_url)
    `)
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  if (entityId) {
    query = query.eq("entity_id", entityId);
  }

  if (parentId) {
    query = query.eq("parent_id", parentId);
  } else {
    // Get root collections by default
    query = query.is("parent_id", null);
  }

  const { data, error: dbError } = await query;

  if (dbError) {
    console.error("Error fetching collections:", dbError);
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  const useSigned = getStorageProvider() === "r2" && !isR2PublicUrlConfigured();
  const hydrated = await Promise.all(
    (data || []).map(async (c: any) => {
      const cover = c?.cover_asset;
      if (!cover) return c;
      const thumb = cover.thumbnail_path
        ? (useSigned ? await getClientReadUrl(cover.thumbnail_path, 3600) : cover.thumbnail_path)
        : null;
      const cdn = cover.cdn_url
        ? cover.cdn_url
        : null;
      return {
        ...c,
        cover_asset: {
          ...cover,
          thumbnail_path: thumb,
          cdn_url: cdn,
        },
      };
    })
  );

  return NextResponse.json({ success: true, data: hydrated });
}

// POST /api/media/collections
export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { name, description, entity_id, parent_id, is_smart, smart_rules } = body;

    if (!name) {
      return badRequestResponse("name is required");
    }

    const insertData = {
      tenant_id: tenantId,
      owner_id: user.id,
      name,
      description: description || null,
      entity_id: entity_id || null,
      parent_id: parent_id || null,
      is_smart: is_smart || false,
      smart_rules: smart_rules || null,
    };

    const { data, error: insertError } = await supabase
      .from("media_collections")
      .insert(insertData as never)
      .select("*")
      .single();

    if (insertError) {
      console.error("Error creating collection:", insertError);
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Error creating collection:", err);
    return NextResponse.json({ success: false, error: "Failed to create collection" }, { status: 500 });
  }
}
