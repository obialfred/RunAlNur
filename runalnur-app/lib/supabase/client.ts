import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Lazy-initialized client singleton
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Supabase credentials not found. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.'
    );
    // Return a stub client for build time
    return {
      from: () => ({ select: () => ({ data: null, error: null }) }),
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
      channel: () => ({
        on: () => ({
          subscribe: () => ({ unsubscribe: () => {} }),
        }),
        subscribe: () => ({ unsubscribe: () => {} }),
      }),
      removeChannel: () => {},
    } as unknown as SupabaseClient;
  }
  
  _supabase = createClient(supabaseUrl, supabaseAnonKey);
  return _supabase;
}

// Export as getter for backwards compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return Reflect.get(getSupabase(), prop);
  },
});

// Database types based on our schema
export type Database = {
  public: {
    Tables: {
      arms: {
        Row: {
          id: string;
          name: string;
          slug: string;
          head: string;
          description: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          head: string;
          description: string;
          color: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          head?: string;
          description?: string;
          color?: string;
          created_at?: string;
        };
      };
      tenants: {
        Row: {
          id: string;
          slug: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          created_at?: string;
        };
      };
      tenant_memberships: {
        Row: {
          tenant_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          tenant_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          tenant_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          tenant_id: string;
          owner_id: string;
          arm_id: string | null;
          name: string;
          description: string | null;
          status: string;
          priority: string;
          clickup_id: string | null;
          due_date: string | null;
          progress: number;
          tasks_total: number;
          tasks_completed: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          owner_id: string;
          arm_id?: string | null;
          name: string;
          description?: string | null;
          status?: string;
          priority?: string;
          clickup_id?: string | null;
          due_date?: string | null;
          progress?: number;
          tasks_total?: number;
          tasks_completed?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          owner_id?: string;
          arm_id?: string | null;
          name?: string;
          description?: string | null;
          status?: string;
          priority?: string;
          clickup_id?: string | null;
          due_date?: string | null;
          progress?: number;
          tasks_total?: number;
          tasks_completed?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          tenant_id: string;
          owner_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          role: string | null;
          arm_id: string | null;
          hubspot_id: string | null;
          external_refs: Record<string, unknown> | null;
          socials: Record<string, unknown> | null;
          notes: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          owner_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          role?: string | null;
          arm_id?: string | null;
          hubspot_id?: string | null;
          external_refs?: Record<string, unknown> | null;
          socials?: Record<string, unknown> | null;
          notes?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          owner_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          role?: string | null;
          arm_id?: string | null;
          hubspot_id?: string | null;
          external_refs?: Record<string, unknown> | null;
          socials?: Record<string, unknown> | null;
          notes?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          tenant_id: string;
          owner_id: string;
          project_id: string;
          name: string;
          description: string | null;
          status: string;
          priority: string;
          assignee: string | null;
          due_date: string | null;
          clickup_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          owner_id: string;
          project_id: string;
          name: string;
          description?: string | null;
          status?: string;
          priority?: string;
          assignee?: string | null;
          due_date?: string | null;
          clickup_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          owner_id?: string;
          project_id?: string;
          name?: string;
          description?: string | null;
          status?: string;
          priority?: string;
          assignee?: string | null;
          due_date?: string | null;
          clickup_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string | null;
          type: string;
          description: string;
          arm_id: string | null;
          project_id: string | null;
          contact_id: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id?: string | null;
          type: string;
          description: string;
          arm_id?: string | null;
          project_id?: string | null;
          contact_id?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string | null;
          type?: string;
          description?: string;
          arm_id?: string | null;
          project_id?: string | null;
          contact_id?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      attachments: {
        Row: {
          id: string;
          tenant_id: string;
          owner_id: string;
          entity_type: string;
          entity_id: string;
          file_path: string;
          file_name: string;
          file_type: string | null;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          owner_id: string;
          entity_type: string;
          entity_id: string;
          file_path: string;
          file_name: string;
          file_type?: string | null;
          file_size?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          owner_id?: string;
          entity_type?: string;
          entity_id?: string;
          file_path?: string;
          file_name?: string;
          file_type?: string | null;
          file_size?: number | null;
          created_at?: string;
        };
      };
      integrations: {
        Row: {
          id: string;
          provider: string;
          access_token: string | null;
          refresh_token: string | null;
          expires_at: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider: string;
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      clickup_mappings: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          arm_id: string;
          list_id: string;
          list_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          arm_id: string;
          list_id: string;
          list_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          arm_id?: string;
          list_id?: string;
          list_name?: string | null;
          created_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          tenant_id: string;
          owner_id: string;
          arm_id: string | null;
          name: string;
          address: string | null;
          units: number | null;
          sqft: number | null;
          acquisition_date: string | null;
          purchase_price: number | null;
          renovation_budget: number | null;
          target_rent: number | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          owner_id: string;
          arm_id?: string | null;
          name: string;
          address?: string | null;
          units?: number | null;
          sqft?: number | null;
          acquisition_date?: string | null;
          purchase_price?: number | null;
          renovation_budget?: number | null;
          target_rent?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          owner_id?: string;
          arm_id?: string | null;
          name?: string;
          address?: string | null;
          units?: number | null;
          sqft?: number | null;
          acquisition_date?: string | null;
          purchase_price?: number | null;
          renovation_budget?: number | null;
          target_rent?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      renovation_phases: {
        Row: {
          id: string;
          property_id: string;
          name: string;
          status: string;
          start_date: string | null;
          end_date: string | null;
          budget: number | null;
          actual_cost: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          name: string;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
          budget?: number | null;
          actual_cost?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          name?: string;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
          budget?: number | null;
          actual_cost?: number | null;
          created_at?: string;
        };
      };
      vendors: {
        Row: {
          id: string;
          arm_id: string | null;
          name: string;
          vendor_type: string | null;
          contact_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          arm_id?: string | null;
          name: string;
          vendor_type?: string | null;
          contact_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          arm_id?: string | null;
          name?: string;
          vendor_type?: string | null;
          contact_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      deals: {
        Row: {
          id: string;
          tenant_id: string;
          owner_id: string;
          arm_id: string | null;
          hubspot_id: string | null;
          name: string;
          stage: string;
          score: number;
          amount: number | null;
          status: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          owner_id: string;
          arm_id?: string | null;
          hubspot_id?: string | null;
          name: string;
          stage?: string;
          score?: number;
          amount?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          owner_id?: string;
          arm_id?: string | null;
          hubspot_id?: string | null;
          name?: string;
          stage?: string;
          score?: number;
          amount?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      sops: {
        Row: {
          id: string;
          tenant_id: string;
          owner_id: string;
          name: string;
          description: string | null;
          arm_id: string | null;
          process_street_id: string | null;
          steps: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          owner_id: string;
          name: string;
          description?: string | null;
          arm_id?: string | null;
          process_street_id?: string | null;
          steps?: unknown;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          arm_id?: string | null;
          process_street_id?: string | null;
          steps?: unknown;
          created_at?: string;
          updated_at?: string;
        };
      };
      sop_runs: {
        Row: {
          id: string;
          tenant_id: string;
          sop_id: string;
          project_id: string | null;
          status: string;
          current_step: number;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          sop_id: string;
          project_id?: string | null;
          status?: string;
          current_step?: number;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          sop_id?: string;
          project_id?: string | null;
          status?: string;
          current_step?: number;
          started_at?: string;
          completed_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          type: string;
          title: string;
          message: string | null;
          read: boolean;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          type: string;
          title: string;
          message?: string | null;
          read?: boolean;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string | null;
          read?: boolean;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          tenant_id: string;
          email: string;
          name: string | null;
          role: string;
          arm_access: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          tenant_id: string;
          email: string;
          name?: string | null;
          role?: string;
          arm_access?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          email?: string;
          name?: string | null;
          role?: string;
          arm_access?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      approvals: {
        Row: {
          id: string;
          tenant_id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          requester_id: string | null;
          approver_id: string | null;
          status: string;
          notes: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          requester_id?: string | null;
          approver_id?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          entity_type?: string;
          entity_id?: string;
          action?: string;
          requester_id?: string | null;
          approver_id?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
      };

      // ---------------------------------------------------------------------
      // Multi-user + Integrations + COO (added for strict typing, avoids `any`)
      // ---------------------------------------------------------------------
      user_integrations: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          kind: string;
          secret_enc: string;
          secret_iv: string;
          secret_tag: string;
          expires_at: string | null;
          scopes: string[] | null;
          metadata: Record<string, unknown> | null;
          connected_at: string;
          revoked_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          kind: string;
          secret_enc: string;
          secret_iv: string;
          secret_tag: string;
          expires_at?: string | null;
          scopes?: string[] | null;
          metadata?: Record<string, unknown> | null;
          connected_at?: string;
          revoked_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          kind?: string;
          secret_enc?: string;
          secret_iv?: string;
          secret_tag?: string;
          expires_at?: string | null;
          scopes?: string[] | null;
          metadata?: Record<string, unknown> | null;
          connected_at?: string;
          revoked_at?: string | null;
          updated_at?: string;
        };
      };

      oauth_states: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          state: string;
          redirect_uri: string | null;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          state: string;
          redirect_uri?: string | null;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          state?: string;
          redirect_uri?: string | null;
          created_at?: string;
          expires_at?: string;
        };
      };

      device_tokens: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          token: string;
          platform: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          token: string;
          platform: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          token?: string;
          platform?: string;
          created_at?: string;
          updated_at?: string;
        };
      };

      // COO tables
      coo_priorities: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          date: string;
          priorities: unknown;
          model_used: string | null;
          knowledge_context: Record<string, unknown> | null;
          generated_at: string;
          accepted_at: string | null;
          modified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          date: string;
          priorities?: unknown;
          model_used?: string | null;
          knowledge_context?: Record<string, unknown> | null;
          generated_at?: string;
          accepted_at?: string | null;
          modified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          date?: string;
          priorities?: unknown;
          model_used?: string | null;
          knowledge_context?: Record<string, unknown> | null;
          generated_at?: string;
          accepted_at?: string | null;
          modified_at?: string | null;
          created_at?: string;
        };
      };

      coo_focus_sessions: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          priority_id: string | null;
          priority_rank: number | null;
          task_id: string | null;
          task_title: string;
          started_at: string;
          paused_at: string | null;
          ended_at: string | null;
          total_duration_minutes: number;
          outcome: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          priority_id?: string | null;
          priority_rank?: number | null;
          task_id?: string | null;
          task_title: string;
          started_at?: string;
          paused_at?: string | null;
          ended_at?: string | null;
          total_duration_minutes?: number;
          outcome?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          priority_id?: string | null;
          priority_rank?: number | null;
          task_id?: string | null;
          task_title?: string;
          started_at?: string;
          paused_at?: string | null;
          ended_at?: string | null;
          total_duration_minutes?: number;
          outcome?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };

      coo_preferences: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          morning_briefing_time: string | null;
          evening_summary_time: string | null;
          max_priorities: number;
          push_intensity: string;
          preferred_model: string;
          timezone: string;
          briefing_enabled: boolean;
          accountability_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          morning_briefing_time?: string | null;
          evening_summary_time?: string | null;
          max_priorities?: number;
          push_intensity?: string;
          preferred_model?: string;
          timezone?: string;
          briefing_enabled?: boolean;
          accountability_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          morning_briefing_time?: string | null;
          evening_summary_time?: string | null;
          max_priorities?: number;
          push_intensity?: string;
          preferred_model?: string;
          timezone?: string;
          briefing_enabled?: boolean;
          accountability_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      coo_accountability_log: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          event_type: string;
          priority_id: string | null;
          session_id: string | null;
          details: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          event_type: string;
          priority_id?: string | null;
          session_id?: string | null;
          details?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          event_type?: string;
          priority_id?: string | null;
          session_id?: string | null;
          details?: Record<string, unknown> | null;
          created_at?: string;
        };
      };

      // Influence follow-ups (relationships)
      influence_followups: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          contact_id: string;
          due_at: string;
          status: string;
          note: string | null;
          source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          contact_id: string;
          due_at: string;
          status?: string;
          note?: string | null;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          contact_id?: string;
          due_at?: string;
          status?: string;
          note?: string | null;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // Calendar sync config (Google Calendar)
      calendar_sync_config: {
        Row: {
          user_id: string;
          google_calendar_enabled: boolean;
          google_access_token_enc: string | null;
          google_refresh_token_enc: string | null;
          google_token_expires_at: string | null;
          last_sync_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          google_calendar_enabled?: boolean;
          google_access_token_enc?: string | null;
          google_refresh_token_enc?: string | null;
          google_token_expires_at?: string | null;
          last_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          google_calendar_enabled?: boolean;
          google_access_token_enc?: string | null;
          google_refresh_token_enc?: string | null;
          google_token_expires_at?: string | null;
          last_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
