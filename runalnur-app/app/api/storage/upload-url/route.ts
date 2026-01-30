import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api/auth";

// Allowed buckets - prevent accessing arbitrary storage
const ALLOWED_BUCKETS = ["attachments", "avatars", "documents"];

// POST /api/storage/upload-url - Generate signed upload URL
export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser(request);
  
  if (!user) {
    return unauthorizedResponse(error || "Authentication required");
  }

  try {
    const body = await request.json();
    const { bucket = "attachments", path, contentType } = body;

    if (!path) {
      return NextResponse.json(
        { success: false, error: "path is required" },
        { status: 400 }
      );
    }

    // Validate bucket is allowed
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json(
        { success: false, error: `Bucket '${bucket}' is not allowed` },
        { status: 400 }
      );
    }

    // Ensure path is scoped to user to prevent unauthorized access
    // Format: user_id/filename or user_id/subpath/filename
    const userScopedPath = path.startsWith(`${user.id}/`) 
      ? path 
      : `${user.id}/${path}`;

    // Validate path doesn't contain directory traversal
    if (userScopedPath.includes("..") || userScopedPath.includes("//")) {
      return NextResponse.json(
        { success: false, error: "Invalid path" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Storage not configured" },
        { status: 503 }
      );
    }

    const { data, error: storageError } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(userScopedPath);

    if (storageError) {
      return NextResponse.json(
        { success: false, error: storageError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        ...data,
        // Return the actual path used (with user scoping)
        path: userScopedPath,
      }
    });
  } catch (err) {
    console.error("Error generating upload URL:", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
