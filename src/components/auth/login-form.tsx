"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message === "Invalid login credentials") {
        setError("Incorrect email or password. Please try again.");
      } else if (error.message.includes("Email not confirmed")) {
        setError("Please check your email and confirm your account first.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email address"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        prefix={<Mail className="w-4 h-4" />}
        required
        autoComplete="email"
        autoFocus
      />
      <div className="space-y-1">
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="pointer-events-auto text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          required
          autoComplete="current-password"
        />
        <div className="flex justify-end">
          <a href="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot password?
          </a>
        </div>
      </div>

      {error && (
        <div className="rounded-[8px] bg-red-50 border border-red-100 px-3 py-2.5">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button type="submit" size="md" className="w-full" loading={loading}>
        Sign in
      </Button>
    </form>
  );
}
