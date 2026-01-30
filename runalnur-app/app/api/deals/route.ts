import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse } from "@/lib/api/auth";

// In-memory demo deals for Janna arm
const sampleDeals = [
  {
    id: "deal-1",
    arm_id: "janna",
    name: "Downtown Duplex Acquisition",
    stage: "negotiation",
    amount: 450000,
    property_address: "123 Main Street",
    contact_name: "John Smith",
    hubspot_id: null,
    notes: "Motivated seller, asking price negotiable",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "deal-2",
    arm_id: "janna",
    name: "Oak Street Fourplex",
    stage: "closed_won",
    amount: 680000,
    property_address: "456 Oak Street",
    contact_name: "Sarah Johnson",
    hubspot_id: "hs-123",
    notes: "Closed successfully, renovation starting next month",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: "deal-3",
    arm_id: "janna",
    name: "Riverside Cottage",
    stage: "lead",
    amount: 220000,
    property_address: "789 River Road",
    contact_name: "Mike Wilson",
    hubspot_id: null,
    notes: "Initial inquiry, scheduling viewing",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: "deal-4",
    arm_id: "janna",
    name: "Maple Avenue Triplex",
    stage: "due_diligence",
    amount: 520000,
    property_address: "321 Maple Avenue",
    contact_name: "Lisa Chen",
    hubspot_id: "hs-456",
    notes: "Inspection scheduled for next week",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

// GET /api/deals - List deals
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { tenantId, supabase } = context;

  const { searchParams } = new URL(request.url);
  const armId = searchParams.get("arm_id");

  if (!supabase) {
    // Demo-mode fallback: return sample deals
    let deals = [...sampleDeals];
    if (armId) deals = deals.filter((d) => d.arm_id === armId);
    return NextResponse.json({ success: true, data: deals });
  }

  let query = supabase.from("deals").select("*").eq("tenant_id", tenantId);
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

// POST /api/deals - Create a deal
export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;
  
  try {
    const body = await request.json();
    
    if (!supabase) {
      // Demo-mode fallback: add to in-memory store
      const newDeal = {
        id: `deal-${Date.now()}`,
        arm_id: body.arm_id || "janna",
        name: body.name || "New Deal",
        stage: body.stage || "lead",
        amount: body.amount || 0,
        property_address: body.property_address || "",
        contact_name: body.contact_name || "",
        hubspot_id: null,
        notes: body.notes || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      sampleDeals.push(newDeal);
      return NextResponse.json({ success: true, data: newDeal });
    }
    
    const insertData = {
      ...body,
      tenant_id: tenantId,
      owner_id: user.id,
    };

    const { data, error: insertError } = await supabase
      .from("deals")
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
    console.error("Error creating deal:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create deal" },
      { status: 500 }
    );
  }
}
