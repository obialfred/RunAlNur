"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { spring } from "@/lib/motion/tokens";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setValidSession(!!session);
    };
    checkSession();
  }, [supabase.auth]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push("/");
    }, 2000);
  };

  if (validSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          className="w-full max-w-sm agentic-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.default}
        >
          <div className="agentic-card-header">
            <h1 className="text-section">Invalid Link</h1>
          </div>
          <div className="agentic-card-content space-y-4">
            <p className="text-sm text-muted-foreground">
              This password reset link is invalid or has expired.
            </p>
            <div className="pt-2">
              <Link href="/forgot-password">
                <Button className="w-full h-9 text-xs">
                  REQUEST NEW LINK
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

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
            <h1 className="text-section">Password Updated</h1>
          </div>
          <div className="agentic-card-content space-y-4">
            <p className="text-sm text-muted-foreground">
              Your password has been successfully reset.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </p>
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
          <h1 className="text-section">Set New Password</h1>
        </div>
        <div className="agentic-card-content">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                New Password
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
            {error && (
              <div className="text-xs text-[var(--error)]">{error}</div>
            )}
            <Button type="submit" className="w-full h-9 text-xs" disabled={loading}>
              {loading ? "UPDATING..." : "UPDATE PASSWORD"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
