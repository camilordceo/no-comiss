"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SocialAuth } from "@/components/auth/social-auth";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          setError("An account with this email already exists. Try signing in.");
        } else {
          setError("Something went wrong creating your account. Please try again.");
        }
        return;
      }

      if (data.session) {
        // Email confirmation disabled — logged in immediately
        router.push("/dashboard");
        router.refresh();
      } else {
        // Email confirmation required
        setEmailSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">Check your email</h3>
          <p className="text-sm text-gray-500">
            We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
            Click it to activate your account and get started.
          </p>
        </div>
        <p className="text-xs text-gray-400">
          Didn&apos;t receive it? Check your spam folder.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SocialAuth />
      <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        label="Full name"
        type="text"
        placeholder="Jane Smith"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        prefix={<User className="w-4 h-4" />}
        required
        autoComplete="name"
        autoFocus
      />
      <Input
        label="Email address"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        prefix={<Mail className="w-4 h-4" />}
        required
        autoComplete="email"
      />
      <Input
        label="Password"
        type={showPassword ? "text" : "password"}
        placeholder="Minimum 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        suffix={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="pointer-events-auto text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showPassword ? "Hide" : "Show"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
        required
        autoComplete="new-password"
      />

      {error && (
        <div className="rounded-[8px] bg-red-50 border border-red-100 px-3 py-2.5">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button type="submit" size="md" className="w-full" loading={loading}>
        Create free account
      </Button>
    </form>
    </div>
  );
}
