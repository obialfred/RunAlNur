import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api/auth";
import { getGoogleAuthUrl } from "@/lib/calendar/google";

export async function GET(request: NextRequest) {
  // Check authentication
  const { user, error } = await getAuthenticatedUser(request);
  
  if (!user) {
    return unauthorizedResponse(error || "Authentication required");
  }

  try {
    // Generate state for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        timestamp: Date.now(),
      })
    ).toString("base64url");

    // Get the authorization URL
    const authUrl = getGoogleAuthUrl(state);

    return NextResponse.json({
      success: true,
      authUrl,
    });
  } catch (err) {
    console.error("Calendar connect error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate authorization URL" },
      { status: 500 }
    );
  }
}
