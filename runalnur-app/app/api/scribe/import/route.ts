import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 400 });
  }

  const body = await request.json();
  const { name, description, steps, arm_id } = body;

  if (!name) {
    return NextResponse.json({ success: false, error: "name is required" }, { status: 400 });
  }

  const insertData = {
    name,
    description: description || null,
    arm_id: arm_id || null,
    steps: steps || [],
  };

  const { data, error } = await supabase
    .from("sops")
    .insert(insertData as never)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
