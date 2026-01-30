import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api/auth";

// POST /api/auth/setup-profile - Create or update user profile securely
export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser(request);
  
  if (!user) {
    return unauthorizedResponse(error || "Authentication required");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { success: false, error: "Server configuration error" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { name } = body;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Ensure default tenant exists and fetch its id
    const { data: tenantRow, error: tenantUpsertError } = await adminClient
      .from("tenants")
      .upsert({ slug: "house_al_nur", name: "House Al Nur" } as never, {
        onConflict: "slug",
      })
      .select("id")
      .single();

    if (tenantUpsertError || !tenantRow?.id) {
      return NextResponse.json(
        { success: false, error: "Failed to resolve default tenant" },
        { status: 500 }
      );
    }

    const tenantId = tenantRow.id as string;

    // Check if profile already exists
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id, role, name")
      .eq("id", user.id)
      .single();

    if (existingProfile) {
      // Profile exists, only update safe fields (not role)
      const existingName = (existingProfile as { name?: string }).name;
      const { data, error: updateError } = await adminClient
        .from("profiles")
        .update({
          name: name || existingName,
          email: user.email,
          tenant_id: tenantId,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", user.id)
        .select("*")
        .single();

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    // New profile - check if this is the first user (gets owner role)
    const { count } = await adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const isFirstUser = count === 0;

    // Ensure membership row exists for this user in default tenant
    await adminClient
      .from("tenant_memberships")
      .upsert(
        {
          tenant_id: tenantId,
          user_id: user.id,
          role: isFirstUser ? "owner" : "member",
        } as never,
        { onConflict: "tenant_id,user_id" }
      );

    const { data, error: insertError } = await adminClient
      .from("profiles")
      .insert({
        id: user.id,
        tenant_id: tenantId,
        email: user.email,
        name: name || null,
        // First user gets owner role, others get member
        role: isFirstUser ? "owner" : "member",
        arm_access: [],
      } as never)
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data, isFirstUser });
  } catch (err) {
    console.error("Setup profile error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to setup profile" },
      { status: 500 }
    );
  }
}
