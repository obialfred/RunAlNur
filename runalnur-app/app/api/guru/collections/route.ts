import { NextRequest, NextResponse } from "next/server";
import { getGuruClient, GuruClient } from "@/lib/integrations/guru";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";
import { getApiKey } from "@/lib/integrations/user-credentials";

/**
 * Get a Guru client for the authenticated user
 */
// GET /api/guru/collections - Get all Guru collections
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || undefined);

  const credentials = await getApiKey(context.tenantId, context.user.id, "guru");
  const client = credentials ? new GuruClient(credentials) : (process.env.DEMO_MODE === "true" ? getGuruClient() : null);
  if (!client) {
    return NextResponse.json(
      { success: false, error: "Guru not connected" },
      { status: 400 }
    );
  }

  try {
    const collections = await client.getCollections();
    return NextResponse.json({ 
      success: true, 
      data: collections,
      count: collections.length,
    });
  } catch (error) {
    console.error("Guru collections error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch collections" 
      },
      { status: 500 }
    );
  }
}
