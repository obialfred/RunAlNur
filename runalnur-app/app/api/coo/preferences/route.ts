import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/api/auth';
import { DEFAULT_COO_PREFERENCES } from '@/lib/coo/types';
import { demoGetPreferences, demoUpdatePreferences } from "@/lib/coo/demo-store";

type COOPreferencesRow = {
  id: string;
  user_id: string;
  morning_briefing_time: string;
  evening_summary_time: string;
  max_priorities: number;
  push_intensity: 'gentle' | 'medium' | 'aggressive';
  preferred_model: 'opus' | 'gemini' | 'both';
  timezone: string;
  briefing_enabled: boolean;
  accountability_enabled: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * GET /api/coo/preferences
 * Get COO preferences for the authenticated user
 */
export async function GET(request: NextRequest) {
  const { context, error: authError } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(authError || 'Authentication required');
  const { user, tenantId, supabase } = context;
  const demoMode = process.env.DEMO_MODE === "true";

  try {
    if (!supabase) {
      if (!demoMode) {
        return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
      }
      return NextResponse.json({ success: true, data: demoGetPreferences(user.id) });
    }

    const { data: preferences, error: dbError } = await supabase
      .from('coo_preferences')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      throw dbError;
    }

    // Return defaults if no preferences exist (shape matches COOPreferences)
    if (!preferences) {
      const now = new Date().toISOString();
      return NextResponse.json({
        success: true,
        data: {
          id: 'default',
          user_id: user.id,
          tenant_id: tenantId,
          ...DEFAULT_COO_PREFERENCES,
          created_at: now,
          updated_at: now,
        },
      });
    }

    const row = preferences as unknown as COOPreferencesRow;
    return NextResponse.json({
      success: true,
      data: row,
    });
  } catch (error) {
    console.error('[COO Preferences API] Error fetching:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/coo/preferences
 * Update COO preferences
 */
export async function PUT(request: NextRequest) {
  const { context, error: authError } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(authError || 'Authentication required');
  const { user, tenantId, supabase } = context;
  const demoMode = process.env.DEMO_MODE === "true";

  try {
    const body = await request.json();

    // Validate inputs
    const updates: Record<string, unknown> = {};

    const morningBriefingTime = body.morning_briefing_time ?? body.morningBriefingTime;
    const eveningSummaryTime = body.evening_summary_time ?? body.eveningSummaryTime;
    const maxPriorities = body.max_priorities ?? body.maxPriorities;
    const pushIntensity = body.push_intensity ?? body.pushIntensity;
    const preferredModel = body.preferred_model ?? body.preferredModel;
    const timezone = body.timezone;
    const briefingEnabled = body.briefing_enabled ?? body.briefingEnabled;
    const accountabilityEnabled = body.accountability_enabled ?? body.accountabilityEnabled;

    if (morningBriefingTime !== undefined) {
      // Validate time format (HH:MM)
      if (!/^\d{2}:\d{2}$/.test(String(morningBriefingTime))) {
        return NextResponse.json(
          { success: false, error: 'Invalid time format for morning_briefing_time. Use HH:MM.' },
          { status: 400 }
        );
      }
      updates.morning_briefing_time = String(morningBriefingTime);
    }

    if (eveningSummaryTime !== undefined) {
      if (!/^\d{2}:\d{2}$/.test(String(eveningSummaryTime))) {
        return NextResponse.json(
          { success: false, error: 'Invalid time format for evening_summary_time. Use HH:MM.' },
          { status: 400 }
        );
      }
      updates.evening_summary_time = String(eveningSummaryTime);
    }

    if (maxPriorities !== undefined) {
      const max = parseInt(String(maxPriorities), 10);
      if (isNaN(max) || max < 1 || max > 10) {
        return NextResponse.json(
          { success: false, error: 'max_priorities must be between 1 and 10.' },
          { status: 400 }
        );
      }
      updates.max_priorities = max;
    }

    if (pushIntensity !== undefined) {
      if (!['gentle', 'medium', 'aggressive'].includes(String(pushIntensity))) {
        return NextResponse.json(
          { success: false, error: 'push_intensity must be gentle, medium, or aggressive.' },
          { status: 400 }
        );
      }
      updates.push_intensity = pushIntensity;
    }

    if (preferredModel !== undefined) {
      if (!['opus', 'gemini', 'both'].includes(String(preferredModel))) {
        return NextResponse.json(
          { success: false, error: 'preferred_model must be opus, gemini, or both.' },
          { status: 400 }
        );
      }
      updates.preferred_model = preferredModel;
    }

    if (timezone !== undefined) {
      updates.timezone = timezone;
    }

    if (briefingEnabled !== undefined) {
      updates.briefing_enabled = Boolean(briefingEnabled);
    }

    if (accountabilityEnabled !== undefined) {
      updates.accountability_enabled = Boolean(accountabilityEnabled);
    }

    if (!supabase) {
      if (!demoMode) {
        return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
      }
      const next = demoUpdatePreferences(user.id, updates);
      return NextResponse.json({ success: true, data: next, message: 'Preferences updated' });
    }

    // Upsert preferences
    const { data: saved, error: dbError } = await (supabase as unknown as { from: (t: string) => any })
      .from('coo_preferences')
      .upsert({
        tenant_id: tenantId,
        user_id: user.id,
        ...DEFAULT_COO_PREFERENCES,
        ...updates,
      }, {
        onConflict: 'tenant_id,user_id',
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      data: saved as unknown as COOPreferencesRow,
      message: 'Preferences updated',
    });
  } catch (error) {
    console.error('[COO Preferences API] Error updating:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
