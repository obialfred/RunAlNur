"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseClient, isSupabaseClientConfigured } from "@/lib/supabase/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { spring } from "@/lib/motion/tokens";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const configError = !isSupabaseClientConfigured();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (configError) {
      setError("Authentication service not configured. Please contact support.");
      return;
    }

    setLoading(true);
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        // Use the auth callback to properly set up the session and profile
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    // If auto-confirmed (no email verification required),
    // the profile will be created by the auth callback or login flow
    if (data.user && data.session) {
      // Set httpOnly cookies via server endpoint
      try {
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_in: data.session.expires_in,
          }),
        });
      } catch (err) {
        console.error("Session setup error:", err);
      }
      
      // Call the server to create the profile securely
      await fetch("/api/auth/setup-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      router.push("/");
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          className="w-full max-w-sm agentic-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.default}
        >
          <div className="agentic-card-header">
            <h1 className="text-section">Check Your Email</h1>
          </div>
          <div className="agentic-card-content space-y-4">
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a confirmation link to <strong>{email}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Click the link in your email to activate your account.
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button variant="outline" className="w-full h-9 text-xs">
                  BACK TO LOGIN
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        className="w-full max-w-sm agentic-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.default}
      >
        <div className="agentic-card-header">
          <h1 className="text-section">Create Account</h1>
        </div>
        <div className="agentic-card-content">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Full Name
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nurullah Al Nur"
                className="h-9 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
                placeholder="Min. 8 characters"
                className="h-9 text-sm"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                Confirm Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="h-9 text-sm"
                required
              />
            </div>
            {configError && (
              <div className="text-xs text-[var(--error)] p-2 bg-[var(--error)]/10 rounded">
                ⚠️ Authentication service not configured. Add Supabase credentials to use this feature.
              </div>
            )}
            {error && !configError && (
              <div className="text-xs text-[var(--error)]">{error}</div>
            )}
            <Button type="submit" className="w-full h-9 text-xs" disabled={loading || configError}>
              {loading ? "CREATING..." : "CREATE ACCOUNT"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-foreground hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
