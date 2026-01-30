"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { spring } from "@/lib/motion/tokens";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const supabase = createSupabaseClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
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
              We&apos;ve sent password reset instructions to <strong>{email}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Click the link in your email to reset your password.
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
          <Link 
            href="/login" 
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to login
          </Link>
          <h1 className="text-section">Reset Password</h1>
        </div>
        <div className="agentic-card-content">
          <p className="text-sm text-muted-foreground mb-4">
            Enter your email address and we&apos;ll send you instructions to reset your password.
          </p>
          <form onSubmit={handleResetPassword} className="space-y-4">
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
            {error && (
              <div className="text-xs text-[var(--error)]">{error}</div>
            )}
            <Button type="submit" className="w-full h-9 text-xs" disabled={loading}>
              {loading ? "SENDING..." : "SEND RESET LINK"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
