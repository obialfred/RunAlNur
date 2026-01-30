import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    uptime: process.uptime(),
    supabase: { configured: isSupabaseConfigured() },
    timestamp: new Date().toISOString(),
  });
}
