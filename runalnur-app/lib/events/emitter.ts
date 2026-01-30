import { getSupabaseAdmin } from "@/lib/supabase/server";

interface EventPayload {
  type: string;
  description: string;
  arm_id?: string | null;
  project_id?: string | null;
  contact_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logEvent(payload: EventPayload) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const insertData = {
    type: payload.type,
    description: payload.description,
    arm_id: payload.arm_id || null,
    project_id: payload.project_id || null,
    contact_id: payload.contact_id || null,
    metadata: payload.metadata || null,
  };

  await supabase.from("activities").insert(insertData as never);
}
