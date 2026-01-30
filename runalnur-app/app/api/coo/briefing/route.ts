import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/api/auth';
import { generateMorningBriefing, generateEODSummary } from '@/lib/coo';
import type { COOPriorityItem } from '@/lib/coo/types';

type COOPrioritiesRow = {
  id: string;
  priorities: unknown;
};

type COOFocusSessionRow = {
  task_title: string;
  total_duration_minutes: number | null;
  outcome: string | null;
};

/**
 * GET /api/coo/briefing
 * Get morning or evening briefing
 * Query params: type=morning|evening
 */
export async function GET(request: NextRequest) {
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || 'Authentication required');
  const { user, tenantId, supabase } = context;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'morning';

  try {
    if (type === 'morning') {
      const briefing = await generateMorningBriefing(tenantId, user.id);
      
      if (!briefing) {
        return NextResponse.json(
          { success: false, error: 'Failed to generate morning briefing' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: briefing,
      });
    }

    if (type === 'evening') {
      // Get today's priorities and sessions for EOD summary
      if (!supabase) {
        return NextResponse.json(
          { success: false, error: 'Database not configured' },
          { status: 500 }
        );
      }

      const today = new Date().toISOString().split('T')[0];

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
          error: 'No priorities found for today',
        }, { status: 404 });
      }

      const priorityRow = priorityRecord as unknown as COOPrioritiesRow;
      const priorities = (priorityRow.priorities || []) as COOPriorityItem[];

      // Get today's focus sessions
      const { data: sessions } = await supabase
        .from('coo_focus_sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id)
        .gte('started_at', `${today}T00:00:00`)
        .lt('started_at', `${today}T23:59:59`);

      const sessionRows = ((sessions || []) as unknown as COOFocusSessionRow[]);
      const sessionData = sessionRows.map(s => ({
        title: s.task_title,
        duration: s.total_duration_minutes || 0,
        outcome: s.outcome || 'unknown',
      }));

      const completedCount = priorities.filter(p => p.status === 'completed').length;
      const deferredCount = priorities.filter(p => p.status === 'deferred').length;
      const totalFocusMinutes = sessionData.reduce((sum, s) => sum + s.duration, 0);

      const summary = await generateEODSummary(
        user.id,
        priorities,
        sessionData,
        { completedCount, deferredCount, totalFocusMinutes }
      );

      if (!summary) {
        return NextResponse.json(
          { success: false, error: 'Failed to generate EOD summary' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: summary,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid type. Use "morning" or "evening".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[COO Briefing API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate briefing' },
      { status: 500 }
    );
  }
}
