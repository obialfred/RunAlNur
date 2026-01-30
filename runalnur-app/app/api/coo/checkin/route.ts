import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/api/auth';
import { generateAccountabilityCheckin } from '@/lib/coo';
import type { COOPriorityItem } from '@/lib/coo/types';

type COOPrioritiesRow = {
  id: string;
  priorities: unknown;
};

type COOFocusSessionRow = {
  task_title: string;
  total_duration_minutes: number | null;
  ended_at: string | null;
};

/**
 * POST /api/coo/checkin
 * Get an accountability check-in from the COO
 */
export async function POST(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || 'Authentication required');
  const { user, tenantId, supabase } = context;
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Database not configured' },
      { status: 500 }
    );
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Get today's priorities
    const { data: priorityRecord } = await supabase
      .from('coo_priorities')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (!priorityRecord) {
      return NextResponse.json({
        success: false,
        error: 'No priorities found for today. Generate priorities first.',
      }, { status: 404 });
    }

    const priorityRow = priorityRecord as unknown as COOPrioritiesRow;
    const priorities = (priorityRow.priorities || []) as COOPriorityItem[];

    // Get today's focus sessions to calculate focus time
    const { data: sessions } = await supabase
      .from('coo_focus_sessions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .gte('started_at', `${today}T00:00:00`)
      .lt('started_at', `${today}T23:59:59`);

    const sessionRows = ((sessions || []) as unknown as COOFocusSessionRow[]);
    const totalFocusMinutes = sessionRows.reduce(
      (sum, s) => sum + (s.total_duration_minutes || 0),
      0
    );

    // Find current focus
    const activeSession = sessionRows.find(s => !s.ended_at);
    const currentFocus = activeSession ? activeSession.task_title : null;

    // Calculate hours into workday (assuming 8am start)
    const workdayStart = new Date(today + 'T08:00:00');
    const hoursIntoDay = Math.max(0, (now.getTime() - workdayStart.getTime()) / (1000 * 60 * 60));

    const completedCount = priorities.filter(p => p.status === 'completed').length;

    // Cross-mode: Influence follow-ups due/overdue
    let relationshipsNeedingAttention = 0;
    try {
      const { count } = await supabase
        .from("influence_followups")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("user_id", user.id)
        .eq("status", "open")
        .lte("due_at", today);
      relationshipsNeedingAttention = count || 0;
    } catch {
      relationshipsNeedingAttention = 0;
    }

    // Generate accountability check-in
    const checkin = await generateAccountabilityCheckin(
      user.id,
      priorities,
      {
        completedCount,
        prioritiesTotal: priorities.length,
        currentFocus,
        focusTimeToday: totalFocusMinutes,
        hoursIntoDay: Math.round(hoursIntoDay * 10) / 10,
        relationshipsNeedingAttention,
      }
    );

    if (!checkin) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate check-in' },
        { status: 500 }
      );
    }

    // Log the check-in
    await supabase.from('coo_accountability_log').insert({
      tenant_id: tenantId,
      user_id: user.id,
      event_type: 'checkin_sent',
      priority_id: priorityRow.id,
      details: {
        message: checkin.message,
        tone: checkin.tone,
        status: checkin.currentStatus,
      },
    } as never);

    return NextResponse.json({
      success: true,
      data: checkin,
    });
  } catch (error) {
    console.error('[COO Check-in API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate check-in' },
      { status: 500 }
    );
  }
}
