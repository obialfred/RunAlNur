import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json({ alerts: [] });
    }

    // For now, return empty - would need auth context from cookies
    // In a real implementation, you'd use middleware auth or cookies

    // Return empty for now - this would be implemented with proper auth
    return NextResponse.json({ alerts: [] });
  } catch (error) {
    console.error("Error in cross-mode alerts API:", error);
    return NextResponse.json({ alerts: [] });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();

    // For now, return success without actually storing
    // In production, would need proper auth context
    return NextResponse.json({ 
      alert: { 
        id: crypto.randomUUID(),
        ...body,
        created_at: new Date().toISOString() 
      } 
    });
  } catch (error) {
    console.error("Error in cross-mode alerts POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
