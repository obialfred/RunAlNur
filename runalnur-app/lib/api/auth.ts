import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/client";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
}

export interface AuthResult {
  user: AuthenticatedUser | null;
  error: string | null;
}

export type TenantRole = "owner" | "admin" | "member" | "viewer";

export interface AuthContext {
  user: AuthenticatedUser;
  tenantId: string;
  tenantRole: TenantRole;
  supabase: SupabaseClient<Database>;
}

/**
 * Validate authentication for API routes.
 * Can be called with or without a request parameter.
 * Returns the authenticated user or an error response.
 */
export async function getAuthenticatedUser(request?: NextRequest): Promise<AuthResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, error: "Authentication service not configured" };
  }

  // Get access token from cookie (support both request object and next/headers)
  let accessToken: string | undefined;
  
  if (request) {
    accessToken = request.cookies.get("sb-access-token")?.value;
  } else {
    const cookieStore = await cookies();
    accessToken = cookieStore.get("sb-access-token")?.value;
  }

  if (!accessToken) {
    return { user: null, error: "Authentication required" };
  }

  // Verify token with Supabase
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: "Invalid or expired session" };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role,
    },
    error: null,
  };
}

function createAuthedSupabaseClient(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase client credentials not configured");
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/**
 * Get user + resolved tenant context for API routes.
 *
 * Resolution strategy:
 * - Use the user's earliest membership as the active tenant (until tenant switching is implemented).
 */
export async function getAuthContext(request: NextRequest): Promise<{
  context: AuthContext | null;
  error: string | null;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { context: null, error: "Authentication service not configured" };
  }

  const accessToken = request.cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return { context: null, error: "Authentication required" };
  }

  const supabase = createAuthedSupabaseClient(accessToken);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { context: null, error: "Invalid or expired session" };

  const { data: memberships, error: membershipError } = await supabase
    .from("tenant_memberships")
    .select("tenant_id, role, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  if (membershipError) {
    return { context: null, error: "Failed to resolve tenant membership" };
  }

  const membership = (memberships as unknown as Array<{
    tenant_id: string;
    role: string | null;
    created_at: string;
  }> | null)?.[0];
  if (!membership?.tenant_id) {
    return { context: null, error: "No tenant membership found" };
  }

  const tenantRole = (membership.role as TenantRole | null) ?? "member";

  return {
    context: {
      user: { id: user.id, email: user.email, role: user.user_metadata?.role },
      tenantId: membership.tenant_id,
      tenantRole,
      supabase,
    },
    error: null,
  };
}

/**
 * Higher-order function to wrap API route handlers with authentication.
 * Returns 401 if user is not authenticated.
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { user, error } = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    return handler(request, user);
  };
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

/**
 * Create a forbidden response
 */
export function forbiddenResponse(message = "Forbidden"): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

/**
 * Create a bad request response
 */
export function badRequestResponse(message = "Bad Request"): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthenticatedUser, allowedRoles: string[]): boolean {
  return user.role ? allowedRoles.includes(user.role) : false;
}

/**
 * Rate limiting helper - simple in-memory rate limiter
 * In production, use Redis or a proper rate limiting service
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetTime - now };
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitExceededResponse(resetIn: number): NextResponse {
  return NextResponse.json(
    { success: false, error: "Rate limit exceeded. Try again later." },
    { 
      status: 429,
      headers: {
        "Retry-After": Math.ceil(resetIn / 1000).toString(),
      },
    }
  );
}
