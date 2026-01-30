/**
 * Media Upload URL API
 * 
 * POST /api/media/upload-url - Generate presigned URL for direct browser upload
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse, badRequestResponse } from "@/lib/api/auth";
import { 
  createPresignedUploadUrl, 
  validateFileUpload, 
  getStorageProvider 
} from "@/lib/media/storage";

export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user } = context;

  try {
    const body = await request.json();
    const { file_name, content_type, file_size } = body;

    if (!file_name || !content_type) {
      return badRequestResponse("file_name and content_type are required");
    }

    // Validate file
    const validation = validateFileUpload(content_type, file_size || 0);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Generate presigned URL
    const uploadData = await createPresignedUploadUrl(
      user.id,
      file_name,
      content_type,
      3600 // 1 hour expiry
    );

    return NextResponse.json({
      success: true,
      data: {
        ...uploadData,
        storage_provider: getStorageProvider(),
      },
    });
  } catch (err) {
    console.error("Error generating upload URL:", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
