"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupInput } from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";
import { cn } from "@/lib/utils/cn";

interface PasswordRule {
  label: string;
  test: (pwd: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "A lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "A number", test: (p) => /\d/.test(p) },
];

export function SignupForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false as unknown as true,
    },
  });

  const password = watch("password") ?? "";

  async function onSubmit(values: SignupInput) {
    setSubmitting(true);
    logger.info("auth.signup_attempt", { email: values.email });
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            nombre: values.fullName,
            source: "nocomiss",
          },
          emailRedirectTo:
            (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin) + "/api/auth/callback",
        },
      });

      if (error) {
        logger.warn("auth.signup_failed", { email: values.email, message: error.message });
        toast.error(error.message);
        return;
      }

      logger.info("auth.signup_success", { userId: data.user?.id });

      if (!data.session) {
        toast.success("Check your email to confirm your account.");
        router.push("/login");
        return;
      }

      toast.success("Welcome to NoComiss!");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      logger.error("auth.signup_exception", { error: err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-brand-light-gray bg-white p-8 shadow-sm">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-medium tracking-tight text-brand-black">Get started</h1>
        <p className="text-sm text-brand-muted">List your home in minutes. Save thousands.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Jane Homeowner"
            aria-invalid={!!errors.fullName}
            {...register("fullName")}
          />
          {errors.fullName ? (
            <p role="alert" className="text-xs text-error">
              {errors.fullName.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email ? (
            <p role="alert" className="text-xs text-error">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <ul className="mt-2 grid gap-1 text-xs">
            {PASSWORD_RULES.map((rule) => {
              const ok = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={cn(
                    "flex items-center gap-1.5",
                    ok ? "text-brand-teal" : "text-brand-muted",
                  )}
                >
                  <Check
                    className={cn("h-3 w-3", ok ? "opacity-100" : "opacity-30")}
                    strokeWidth={3}
                    aria-hidden
                  />
                  {rule.label}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword ? (
            <p role="alert" className="text-xs text-error">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        <Controller
          control={control}
          name="terms"
          render={({ field }) => (
            <div className="flex items-start gap-3 pt-1">
              <Checkbox
                id="terms"
                checked={!!field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                onBlur={field.onBlur}
                aria-invalid={!!errors.terms}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label htmlFor="terms" className="font-normal leading-snug">
                  I agree to the{" "}
                  <Link href="/terms" className="font-medium text-brand-teal hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-medium text-brand-teal hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </Label>
                {errors.terms ? (
                  <p role="alert" className="text-xs text-error">
                    {errors.terms.message}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        />

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-teal hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
