import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/api/auth';
import { logEvent } from "@/lib/events/emitter";
import { getContacts, sampleContacts } from "@/lib/data/store";

interface ContactRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
  arm_id: string;
  hubspot_id: string | null;
  external_refs?: Record<string, string> | null;
  socials?: { instagram?: string | null; linkedin?: string | null; website?: string | null } | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  owner_id?: string;
}

// GET /api/contacts - List all contacts
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  const { searchParams } = new URL(request.url);
  const armId = searchParams.get('arm_id');
  const search = searchParams.get('search');
  const debug = searchParams.get('debug') === 'true';

  const demoMode = process.env.DEMO_MODE === "true";

  if (!supabase) {
    if (!demoMode) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
    }
    // Demo-mode fallback
    let contacts = getContacts();
    if (armId) contacts = contacts.filter((c) => c.arm_id === armId);
    if (search) {
      const q = search.toLowerCase();
      contacts = contacts.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.company || "").toLowerCase().includes(q)
      );
    }
    return NextResponse.json({ success: true, data: contacts, total: contacts.length });
  }

  // Query contacts: must match tenant, and either owned by user OR legacy (no owner)
  let query = supabase
    .from('contacts')
    .select('*')
    .eq("tenant_id", tenantId)
    .or(`owner_id.eq.${user.id},owner_id.is.null`);
  
  // Filter by arm if specified
  if (armId) {
    query = query.eq('arm_id', armId);
  }
  
  // Search - properly escape the search term for security
  if (search) {
    // Escape special characters to prevent SQL injection via ilike
    const escapedSearch = search.replace(/[%_\\]/g, '\\$&');
    query = query.or(
      `name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%,company.ilike.%${escapedSearch}%`
    );
  }

  const { data, error: dbError } = await query.order('created_at', { ascending: false });
  
  if (dbError) {
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 500 }
    );
  }

  const rows = (data || []) as ContactRow[];

  return NextResponse.json({
    success: true,
    data: rows || [],
    total: rows?.length || 0,
  });
}

// POST /api/contacts - Create a new contact
export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId, supabase } = context;

  try {
    const body = await request.json();
    const { name, email, phone, socials, company, role, arm_id, notes, tags } = body;

    if (!name || !arm_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and arm_id are required',
          // Dev-only debug to unblock UI audit (helps identify mismatched payload keys)
          debug: process.env.NODE_ENV === "development"
            ? { receivedKeys: Object.keys(body || {}), received: body }
            : undefined,
        },
        { status: 400 }
      );
    }

    const demoMode = process.env.DEMO_MODE === "true";

    if (!supabase) {
      if (!demoMode) {
        return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
      }
      // Demo-mode fallback
      const newContact = {
        id: Date.now().toString(),
        name,
        email: email || null,
        phone: phone || null,
        socials: socials || null,
        company: company || null,
        role: role || null,
        arm_id,
        hubspot_id: null,
        notes: notes || null,
        tags: tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_id: user.id,
      };
      sampleContacts.push(newContact as unknown as (typeof sampleContacts)[number]);
      await logEvent({
        type: "contact_added",
        description: `Added contact "${newContact.name}"`,
        arm_id: newContact.arm_id,
        contact_id: newContact.id,
      });
      return NextResponse.json({ success: true, data: newContact });
    }

    const insertData = {
      tenant_id: tenantId,
      name,
      email: email || null,
      phone: phone || null,
      socials: socials || null,
      company: company || null,
      role: role || null,
      arm_id,
      notes: notes || null,
      tags: tags || [],
      owner_id: user.id,
    };

    const { data, error: insertError } = await supabase
      .from('contacts')
      .insert(insertData as never)
      .select('*')
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    const row = data as ContactRow;
    await logEvent({
      type: "contact_added",
      description: `Added contact "${row.name}"`,
      arm_id: row.arm_id,
      contact_id: row.id,
    });

    return NextResponse.json({ success: true, data: row });
  } catch (err) {
    console.error('Error creating contact:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
