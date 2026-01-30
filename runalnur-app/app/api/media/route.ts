/**
 * Media Assets API
 * 
 * GET /api/media - List media assets with filters
 * POST /api/media - Create media asset record (after upload)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse, badRequestResponse } from "@/lib/api/auth";
import type { MediaAsset, MediaFilters } from "@/lib/media/types";
import { getClientReadUrl, getPublicUrl, getStorageProvider, getFileTypeFromMime, isR2PublicUrlConfigured } from "@/lib/media/storage";

function toPublicUrlMaybe(path: string | null): string | null {
  if (!path) return null;
  // If it's already an absolute URL, keep it.
  if (/^https?:\/\//i.test(path)) return path;
  // Otherwise treat it as a storage key and convert to a public URL.
  return getPublicUrl(path);
}

// GET /api/media - List media with filters
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { tenantId, supabase } = context;

  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  
  // Parse filters
  const filters: MediaFilters = {
    entity_id: searchParams.get("entity_id") as MediaFilters["entity_id"] || undefined,
    collection_id: searchParams.get("collection_id") || undefined,
    file_type: searchParams.get("file_type") as MediaFilters["file_type"] || undefined,
    status: searchParams.get("status") as MediaFilters["status"] || undefined,
    is_favorite: searchParams.get("is_favorite") === "true" ? true : undefined,
    is_brand_asset: searchParams.get("is_brand_asset") === "true" ? true : undefined,
    search: searchParams.get("search") || undefined,
    date_from: searchParams.get("date_from") || undefined,
    date_to: searchParams.get("date_to") || undefined,
  };
  
  // Parse tags array
  const tagsParam = searchParams.get("tags");
  if (tagsParam) {
    filters.tags = tagsParam.split(",");
  }
  
  // Pagination
  const page = parseInt(searchParams.get("page") || "1", 10);
  const perPage = Math.min(parseInt(searchParams.get("per_page") || "50", 10), 100);
  const offset = (page - 1) * perPage;

  // Build query
  let query = supabase
    .from("media_assets")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .neq("status", "deleted");

  // Apply filters
  if (filters.entity_id) {
    query = query.eq("entity_id", filters.entity_id);
  }
  
  if (filters.collection_id) {
    query = query.eq("collection_id", filters.collection_id);
  }
  
  if (filters.file_type) {
    query = query.eq("file_type", filters.file_type);
  }
  
  if (filters.status) {
    query = query.eq("status", filters.status);
  } else {
    // Default to active
    query = query.eq("status", "active");
  }
  
  if (filters.is_favorite !== undefined) {
    query = query.eq("is_favorite", filters.is_favorite);
  }
  
  if (filters.is_brand_asset !== undefined) {
    query = query.eq("is_brand_asset", filters.is_brand_asset);
  }
  
  if (filters.tags && filters.tags.length > 0) {
    // Search in both ai_tags and manual_tags
    query = query.or(`ai_tags.cs.{${filters.tags.join(",")}},manual_tags.cs.{${filters.tags.join(",")}}`);
  }
  
  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},file_name.ilike.${searchTerm}`);
  }
  
  if (filters.date_from) {
    query = query.gte("created_at", filters.date_from);
  }
  
  if (filters.date_to) {
    query = query.lte("created_at", filters.date_to);
  }

  // Order and paginate
  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  const { data, error: dbError, count } = await query;

  if (dbError) {
    console.error("Error fetching media:", dbError);
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  const total = count || 0;

  // Ensure returned assets always have usable URLs for the client.
  // Older rows may have cdn_url NULL and only store storage keys in original_path/thumbnail_path/preview_path,
  // which can crash next/image if passed directly.
  const hydrated: MediaAsset[] = await Promise.all(
    (data || []).map(async (row: MediaAsset) => {
      // If R2 public URL isn't configured, prefer short-lived signed URLs for client display.
      const useSigned = getStorageProvider() === "r2" && !isR2PublicUrlConfigured();

      const cdn_url = row.cdn_url
        ? row.cdn_url
        : useSigned
          ? await getClientReadUrl(row.original_path, 3600)
          : toPublicUrlMaybe(row.original_path);

      const thumb = row.thumbnail_path
        ? (useSigned ? await getClientReadUrl(row.thumbnail_path, 3600) : toPublicUrlMaybe(row.thumbnail_path))
        : null;

      const preview = row.preview_path
        ? (useSigned ? await getClientReadUrl(row.preview_path, 3600) : toPublicUrlMaybe(row.preview_path))
        : null;

      return {
        ...row,
        cdn_url,
        thumbnail_path: thumb,
        preview_path: preview,
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: hydrated,
    total,
    page,
    per_page: perPage,
    has_more: offset + perPage < total,
  });
}

// POST /api/media - Create media asset record
export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      file_name,
      mime_type,
      file_size,
      original_path,
      width,
      height,
      duration_seconds,
      entity_id,
      collection_id,
      title,
      description,
      manual_tags,
      location_name,
      shot_date,
      photographer,
      auto_tag = true,
    } = body;

    // Validate required fields
    if (!file_name || !mime_type || !file_size || !original_path) {
      return badRequestResponse("file_name, mime_type, file_size, and original_path are required");
    }

    const file_type = getFileTypeFromMime(mime_type);
    const storage_provider = getStorageProvider();
    // If R2 is private (no public URL configured), keep cdn_url null and let GET hydrate signed URLs.
    const cdn_url =
      storage_provider === "r2" && !isR2PublicUrlConfigured()
        ? null
        : getPublicUrl(original_path);

    // Insert media asset
    const insertData = {
      tenant_id: tenantId,
      owner_id: user.id,
      file_name,
      file_type,
      mime_type,
      file_size,
      storage_provider,
      original_path,
      cdn_url,
      width: width || null,
      height: height || null,
      duration_seconds: duration_seconds || null,
      entity_id: entity_id || null,
      collection_id: collection_id || null,
      title: title || null,
      description: description || null,
      manual_tags: manual_tags || [],
      location_name: location_name || null,
      shot_date: shot_date || null,
      photographer: photographer || null,
      status: "active", // Always start as active; AI tagging is background processing
    };

    const { data, error: insertError } = await supabase
      .from("media_assets")
      .insert(insertData as never)
      .select("*")
      .single();

    if (insertError) {
      console.error("Error creating media asset:", insertError);
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    const assetData = data as unknown as { id: string } & Record<string, unknown>;

    // If auto_tag is enabled, queue for AI processing
    if (auto_tag && file_type === "image" && assetData?.id) {
      // Queue thumbnail generation and AI tagging
      await supabase.from("media_processing_queue").insert([
        {
          media_asset_id: assetData.id,
          job_type: "thumbnail",
          priority: 1,
        },
        {
          media_asset_id: assetData.id,
          job_type: "ai_tag",
          priority: 5,
        },
      ] as never);
    }

    return NextResponse.json({ success: true, data: assetData });
  } catch (err) {
    console.error("Error creating media:", err);
    return NextResponse.json({ success: false, error: "Failed to create media asset" }, { status: 500 });
  }
}
