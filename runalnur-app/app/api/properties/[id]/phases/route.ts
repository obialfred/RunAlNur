import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/properties/[id]/phases - Get renovation phases for a property
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await getAuthenticatedUser(request);
  
  if (!user) {
    return unauthorizedResponse(error || "Authentication required");
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  const { data, error: dbError } = await supabase
    .from("renovation_phases")
    .select("*")
    .eq("property_id", id)
    .order("created_at", { ascending: true });

  if (dbError) {
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: data || [] });
}

// POST /api/properties/[id]/phases - Create a new renovation phase
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await getAuthenticatedUser(request);
  
  if (!user) {
    return unauthorizedResponse(error || "Authentication required");
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { name, start_date, end_date, budget, status } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Phase name is required" },
        { status: 400 }
      );
    }

    const insertData = {
      property_id: id,
      name,
      start_date: start_date || null,
      end_date: end_date || null,
      budget: budget || null,
      status: status || "planned",
      owner_id: user.id,
    };

    const { data, error: insertError } = await supabase
      .from("renovation_phases")
      .insert(insertData as never)
      .select("*")
      .single();

    if (insertError) {
      // If owner_id doesn't exist, try without it
      if (insertError.message.includes("owner_id")) {
        const { owner_id, ...dataWithoutOwner } = insertData;
        const fallback = await supabase
          .from("renovation_phases")
          .insert(dataWithoutOwner as never)
          .select("*")
          .single();

        if (fallback.error) {
          return NextResponse.json(
            { success: false, error: fallback.error.message },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true, data: fallback.data });
      }

      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Error creating renovation phase:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create phase" },
      { status: 500 }
    );
  }
}
