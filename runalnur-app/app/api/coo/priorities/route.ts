import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/api/auth';
import { generatePriorities } from '@/lib/coo';
import type { COOPriorityItem } from '@/lib/coo/types';
import { demoAcceptPriorities, demoGeneratePriorities, demoGetPriorities, demoModifyPriorities } from "@/lib/coo/demo-store";

type COOPrioritiesRow = {
  id: string;
  date: string;
  priorities: unknown;
  generated_at: string;
  accepted_at: string | null;
  model_used: string | null;
};

/**
 * GET /api/coo/priorities
 * Get today's priorities for the authenticated user
 */
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || 'Authentication required');
  const { user, tenantId, supabase } = context;
  const demoMode = process.env.DEMO_MODE === "true";

  try {
    const today = new Date().toISOString().split('T')[0];

    if (!supabase) {
      if (!demoMode) {
        return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
      }
      const rec = demoGetPriorities(today);
      if (!rec) {
        return NextResponse.json({
          success: true,
          data: null,
          message: 'No priorities generated for today. Call POST to generate.',
        });
      }
      return NextResponse.json({
        success: true,
        data: {
          id: rec.id,
          date: rec.date,
          priorities: rec.priorities,
          generatedAt: rec.generated_at,
          acceptedAt: rec.accepted_at,
          modelUsed: rec.model_used,
        },
      });
    }

    // Get today's priorities from database
    const { data: priorities, error } = await supabase
      .from('coo_priorities')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (not an error)
      throw error;
    }

    if (!priorities) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No priorities generated for today. Call POST to generate.',
      });
    }

    const row = priorities as unknown as COOPrioritiesRow;
    return NextResponse.json({
      success: true,
      data: {
        id: row.id,
        date: row.date,
        priorities: (row.priorities || []) as COOPriorityItem[],
        generatedAt: row.generated_at,
        acceptedAt: row.accepted_at,
        modelUsed: row.model_used,
      },
    });
  } catch (error) {
    console.error('[COO API] Error fetching priorities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch priorities' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coo/priorities
 * Generate new priorities for today
 */
export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || 'Authentication required');
  const { user, tenantId, supabase } = context;
  const demoMode = process.env.DEMO_MODE === "true";

  try {
    const body = await request.json().catch(() => ({}));
    const maxPriorities = body.maxPriorities || 3;

    if (!supabase) {
      if (!demoMode) {
        return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
      }
      const rec = demoGeneratePriorities(maxPriorities);
      return NextResponse.json({
        success: true,
        data: {
          id: rec.id,
          date: rec.date,
          priorities: rec.priorities,
          recommendation: "Demo-mode priorities generated.",
          reasoning: "Demo-mode (no Supabase persistence).",
          generatedAt: rec.generated_at,
          modelUsed: rec.model_used,
        },
      });
    }

    // Cross-mode inputs (Influence followups)
    let relationshipFollowupsDueCount = 0;
    try {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("influence_followups")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("user_id", user.id)
        .eq("status", "open")
        .lte("due_at", today);
      relationshipFollowupsDueCount = count || 0;
    } catch {
      relationshipFollowupsDueCount = 0;
    }

    // Generate priorities using COO engine
    const result = await generatePriorities(tenantId, user.id, {
      maxPriorities,
      additionalContext: {
        ...(body.additionalContext || {}),
        relationshipFollowupsDueCount,
      },
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate priorities. Check Guru and LLM configuration.' },
        { status: 500 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Upsert priorities to database
    const db = supabase as unknown as { from: (t: string) => any };
    const { data: saved, error } = await db
      .from('coo_priorities')
      .upsert({
        tenant_id: tenantId,
        user_id: user.id,
        date: today,
        priorities: result.priorities,
        model_used: 'opus',
        knowledge_context: result.knowledge ? {
          vision: result.knowledge.vision.slice(0, 500),
          principles: result.knowledge.principles,
          currentPhase: result.knowledge.currentPhase.slice(0, 300),
          armsUsed: Object.keys(result.knowledge.armContext),
        } : null,
        generated_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id,user_id,date',
      })
      .select()
      .single();

    if (error) {
      console.error('[COO API] Error saving priorities:', error);
      // Still return the result even if save fails
    }

    return NextResponse.json({
      success: true,
      data: {
        id: saved?.id,
        date: today,
        priorities: result.priorities,
        recommendation: result.recommendation,
        reasoning: result.reasoning,
        generatedAt: new Date().toISOString(),
        modelUsed: 'opus',
      },
    });
  } catch (error) {
    console.error('[COO API] Error generating priorities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate priorities' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/coo/priorities
 * Accept or modify today's priorities
 */
export async function PUT(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || 'Authentication required');
  const { user, tenantId, supabase } = context;
  const demoMode = process.env.DEMO_MODE === "true";

  try {
    const body = await request.json();
    const { action, priorities } = body;
    
    const today = new Date().toISOString().split('T')[0];
    const db = supabase as unknown as { from: (t: string) => any };

    if (!supabase) {
      if (!demoMode) {
        return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
      }
      if (action === "accept") {
        demoAcceptPriorities(today);
        return NextResponse.json({ success: true, message: "Priorities accepted" });
      }
      if (action === "modify" && priorities) {
        demoModifyPriorities(today, priorities as COOPriorityItem[]);
        return NextResponse.json({ success: true, message: "Priorities modified" });
      }
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "accept" or "modify".' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      // Mark priorities as accepted
      const { error } = await db
        .from('coo_priorities')
        .update({ accepted_at: new Date().toISOString() })
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id)
        .eq('date', today);

      if (error) throw error;

      return NextResponse.json({ success: true, message: 'Priorities accepted' });
    }

    if (action === 'modify' && priorities) {
      // Update priorities with modifications
      const { error } = await db
        .from('coo_priorities')
        .update({
          priorities,
          modified_at: new Date().toISOString(),
        })
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id)
        .eq('date', today);

      if (error) throw error;

      return NextResponse.json({ success: true, message: 'Priorities modified' });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "accept" or "modify".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[COO API] Error updating priorities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update priorities' },
      { status: 500 }
    );
  }
}
