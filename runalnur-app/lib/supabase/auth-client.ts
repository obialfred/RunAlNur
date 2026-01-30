"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/client";

let supabaseClient: SupabaseClient<Database> | null = null;

// Stub client for when credentials aren't available (e.g., build time)
const createStubClient = (): SupabaseClient<Database> => {
  const stub = {
    auth: {
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Not configured') }),
    },
    from: () => ({
      select: () => ({ data: null, error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
      eq: () => ({ data: null, error: null }),
    }),
  };
  return stub as unknown as SupabaseClient<Database>;
};

export function createSupabaseClient(): SupabaseClient<Database> {
  // Return stub during SSR/SSG - only create real client on browser
  if (typeof window === 'undefined') {
    return createStubClient();
  }

  // Return cached client if available
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During build or when credentials aren't configured, return a stub
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase client credentials not configured");
    return createStubClient();
  }

  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

// Check if Supabase is properly configured
export function isSupabaseClientConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
