import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    supabase: { configured: isSupabaseConfigured() },
  });
}
