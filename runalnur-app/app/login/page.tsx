"use client";

import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseClient, isSupabaseClientConfigured } from "@/lib/supabase/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { spring } from "@/lib/motion/tokens";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configError = !isSupabaseClientConfigured();

  const redirectError = useMemo(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "config") return "Authentication service not configured";
    if (errorParam === "auth") return "Authentication failed. Please try again.";
    return null;
  }, [searchParams]);

  const displayedError = error ?? redirectError;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (configError) {
      setError("Authentication service not configured. Please contact support.");
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Set httpOnly cookies via server endpoint
    if (data.session) {
      try {
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_in: data.session.expires_in,
          }),
        });

        if (!res.ok) {
          console.error("Failed to set session cookies");
        }
      } catch (err) {
        console.error("Session setup error:", err);
      }
    }

    // Redirect to original destination or home
    const redirectTo = searchParams.get("redirectedFrom") || "/";
    router.push(redirectTo);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        className="w-full max-w-sm agentic-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
      >
        <div className="agentic-card-header">
          <h1 className="text-section">Access</h1>
        </div>
        <div className="agentic-card-content">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>
            {configError && (
              <div className="text-xs text-[var(--error)] p-2 bg-[var(--error)]/10 rounded">
                ⚠️ Authentication service not configured. Add Supabase credentials to use this feature.
              </div>
            )}
            {displayedError && !configError && (
              <div className="text-xs text-[var(--error)]">{displayedError}</div>
            )}
            <Button type="submit" className="w-full h-9 text-xs" disabled={loading || configError}>
              {loading ? "AUTHORIZING..." : "ENTER"}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-xs">
            <Link 
              href="/forgot-password" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </Link>
            <Link 
              href="/signup" 
              className="text-foreground hover:underline"
            >
              Create account
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center text-muted-foreground">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
