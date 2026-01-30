import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from "@/lib/api/auth";
import { logEvent } from "@/lib/events/emitter";
import { getContacts, sampleContacts } from "@/lib/data/store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ContactRecord {
  id: string;
  name: string;
  arm_id: string;
  owner_id?: string;
  [key: string]: unknown;
}

// GET /api/contacts/[id] - Get single contact
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  const { id } = await params;
  const demoMode = process.env.DEMO_MODE === "true";

  if (!supabase) {
    if (!demoMode) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
    }
    const contact = getContacts().find((c) => c.id === id);
    if (!contact) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    const ownerId = (contact as unknown as { owner_id?: string }).owner_id;
    if (ownerId && ownerId !== user.id && user.role !== "admin") {
      return forbiddenResponse("You don't have access to this contact");
    }
    return NextResponse.json({ success: true, data: contact });
  }

  const { data, error: dbError } = await supabase
    .from("contacts")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (dbError) {
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 404 }
    );
  }

  // Check ownership if owner_id exists
  const contact = data as ContactRecord;
  if (contact.owner_id && contact.owner_id !== user.id && user.role !== "admin") {
    return forbiddenResponse("You don't have access to this contact");
  }

  return NextResponse.json({ success: true, data });
}

// PATCH /api/contacts/[id] - Update contact
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  const { id } = await params;
  const body = await request.json();
  const demoMode = process.env.DEMO_MODE === "true";

  if (!supabase) {
    if (!demoMode) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
    }
    const idx = sampleContacts.findIndex((c) => c.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    const existing = sampleContacts[idx] as unknown as ContactRecord;
    const ownerId = existing.owner_id;
    if (ownerId && ownerId !== user.id && user.role !== "admin") {
      return forbiddenResponse("You don't have permission to update this contact");
    }
    const { owner_id, id: bodyId, ...safeBody } = body;
    const updated = { ...existing, ...safeBody, updated_at: new Date().toISOString() };
    sampleContacts[idx] = updated;
    await logEvent({
      type: "contact_updated",
      description: `Updated contact "${updated.name}"`,
      arm_id: updated.arm_id,
      contact_id: updated.id,
    });
    return NextResponse.json({ success: true, data: updated });
  }

  // First check if user has access to this contact
  const { data: existingData, error: fetchError } = await supabase
    .from("contacts")
    .select("id, owner_id, name, arm_id")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json(
      { success: false, error: "Contact not found" },
      { status: 404 }
    );
  }

  const existing = existingData as ContactRecord;

  // Check ownership
  if (existing.owner_id && existing.owner_id !== user.id && user.role !== "admin") {
    return forbiddenResponse("You don't have permission to update this contact");
  }

  // Prevent changing sensitive fields
  const { owner_id, tenant_id, id: bodyId, ...safeBody } = body;
  
  const updateData = { 
    ...safeBody, 
    updated_at: new Date().toISOString() 
  };

  const { data, error: updateError } = await supabase
    .from("contacts")
    .update(updateData as never)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json(
      { success: false, error: updateError.message },
      { status: 500 }
    );
  }

  const updatedContact = data as ContactRecord;
  await logEvent({
    type: "contact_updated",
    description: `Updated contact "${updatedContact.name}"`,
    arm_id: updatedContact.arm_id,
    contact_id: updatedContact.id,
  });

  return NextResponse.json({ success: true, data });
}

// DELETE /api/contacts/[id] - Delete contact
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  const { id } = await params;
  const demoMode = process.env.DEMO_MODE === "true";

  if (!supabase) {
    if (!demoMode) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
    }
    const idx = sampleContacts.findIndex((c) => c.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    const existing = sampleContacts[idx] as unknown as ContactRecord;
    const ownerId = existing.owner_id;
    if (ownerId && ownerId !== user.id && user.role !== "admin") {
      return forbiddenResponse("You don't have permission to delete this contact");
    }
    sampleContacts.splice(idx, 1);
    await logEvent({
      type: "contact_deleted",
      description: `Deleted contact "${existing.name}"`,
      arm_id: existing.arm_id,
      contact_id: id,
    });
    return NextResponse.json({ success: true });
  }

  // First check if user has access to this contact
  const { data: existingData, error: fetchError } = await supabase
    .from("contacts")
    .select("id, owner_id, name, arm_id")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json(
      { success: false, error: "Contact not found" },
      { status: 404 }
    );
  }

  const existing = existingData as ContactRecord;

  // Check ownership
  if (existing.owner_id && existing.owner_id !== user.id && user.role !== "admin") {
    return forbiddenResponse("You don't have permission to delete this contact");
  }

  const { error: deleteError } = await supabase
    .from("contacts")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: deleteError.message },
      { status: 500 }
    );
  }

  await logEvent({
    type: "contact_deleted",
    description: `Deleted contact "${existing.name}"`,
    arm_id: existing.arm_id,
    contact_id: id,
  });

  return NextResponse.json({ success: true });
}
