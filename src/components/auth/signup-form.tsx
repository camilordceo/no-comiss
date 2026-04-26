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
  { label: "Mínimo 8 caracteres", test: (p) => p.length >= 8 },
  { label: "Una letra mayúscula", test: (p) => /[A-Z]/.test(p) },
  { label: "Una letra minúscula", test: (p) => /[a-z]/.test(p) },
  { label: "Un número", test: (p) => /\d/.test(p) },
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
            source: "rentmies",
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
        toast.success("Revisa tu email para confirmar la cuenta.");
        router.push("/login");
        return;
      }

      toast.success("¡Bienvenido a Rentmies!");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      logger.error("auth.signup_exception", { error: err });
      toast.error("Algo salió mal. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface-2 p-7 shadow-sm">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Publica tu primer inmueble en menos de 5 minutos.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nombre completo</Label>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Camilo Pérez"
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
            placeholder="tu@email.com"
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
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
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
                    ok ? "text-brand-green" : "text-muted-foreground",
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
          <Label htmlFor="confirmPassword">Confirma la contraseña</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repite la contraseña"
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
                <Label htmlFor="terms" className="font-normal normal-case tracking-normal leading-snug text-muted-foreground">
                  Acepto los{" "}
                  <Link href="/terms" className="font-semibold text-brand-green hover:underline">
                    Términos de Servicio
                  </Link>{" "}
                  y la{" "}
                  <Link href="/privacy" className="font-semibold text-brand-green hover:underline">
                    Política de Privacidad
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
          {submitting ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-brand-green hover:underline">
          Ingresar
        </Link>
      </p>
    </div>
  );
}
