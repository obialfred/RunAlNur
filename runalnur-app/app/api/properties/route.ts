import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";

// In-memory demo properties for Janna arm
const sampleProperties = [
  {
    id: "prop-1",
    arm_id: "janna",
    name: "Downtown Duplex",
    address: "123 Main Street, Unit A",
    units: 2,
    sqft: 2400,
    purchase_price: 450000,
    renovation_budget: 75000,
    target_rent: 2800,
    status: "renovating",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: "prop-2",
    arm_id: "janna",
    name: "Oak Street Fourplex",
    address: "456 Oak Street",
    units: 4,
    sqft: 4800,
    purchase_price: 680000,
    renovation_budget: 120000,
    target_rent: 5200,
    status: "leased",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
  },
  {
    id: "prop-3",
    arm_id: "janna",
    name: "Riverside Cottage",
    address: "789 River Road",
    units: 1,
    sqft: 1200,
    purchase_price: 220000,
    renovation_budget: 35000,
    target_rent: 1400,
    status: "acquisition",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
];

// GET /api/properties - List properties
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { tenantId, supabase } = context;

  const { searchParams } = new URL(request.url);
  const armId = searchParams.get("arm_id");

  if (!supabase) {
    // Demo-mode fallback: return sample properties
    let properties = [...sampleProperties];
    if (armId) properties = properties.filter((p) => p.arm_id === armId);
    return NextResponse.json({ success: true, data: properties });
  }

  let query = supabase.from("properties").select("*").eq("tenant_id", tenantId);
  if (armId) query = query.eq("arm_id", armId);

  const { data, error: dbError } = await query.order("created_at", { ascending: false });
  
  if (dbError) {
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: data || [] });
}

// POST /api/properties - Create a property
export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;
  
  try {
    const body = await request.json();
    
    if (!supabase) {
      // Demo-mode fallback: add to in-memory store
      const newProperty = {
        id: `prop-${Date.now()}`,
        arm_id: body.arm_id || "janna",
        name: body.name || "New Property",
        address: body.address || "",
        units: body.units || 1,
        sqft: body.sqft || 0,
        purchase_price: body.purchase_price || 0,
        renovation_budget: body.renovation_budget || 0,
        target_rent: body.target_rent || 0,
        status: body.status || "acquisition",
        created_at: new Date().toISOString(),
      };
      sampleProperties.push(newProperty);
      return NextResponse.json({ success: true, data: newProperty });
    }
    
    const insertData = {
      ...body,
      tenant_id: tenantId,
      owner_id: user.id,
    };

    const { data, error: insertError } = await supabase
      .from("properties")
      .insert(insertData as never)
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Error creating property:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create property" },
      { status: 500 }
    );
  }
}
