"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(
        error.message.includes("already registered")
          ? "Ya existe una cuenta con este correo. Inicia sesión."
          : "Error al crear tu cuenta. Intenta de nuevo."
      );
      setLoading(false);
      return;
    }

    // Redirect to onboarding
    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError("Error al continuar con Google.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Google */}
      <Button
        type="button"
        variant="outline"
        size="md"
        className="w-full"
        onClick={handleGoogleSignup}
        loading={googleLoading}
      >
        {!googleLoading && (
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        Continuar con Google
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-gray-400">o con correo</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSignup} className="space-y-3">
        <Input
          label="Nombre completo"
          type="text"
          placeholder="Carlos Rodríguez"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          prefix={<User className="w-4 h-4" />}
          required
          autoComplete="name"
        />
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          prefix={<Mail className="w-4 h-4" />}
          required
          autoComplete="email"
        />
        <Input
          label="Contraseña"
          type={showPassword ? "text" : "password"}
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="pointer-events-auto text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPassword ? "Ocultar" : "Mostrar"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          required
          autoComplete="new-password"
        />

        {error && (
          <div className="rounded-[8px] bg-red-50 border border-red-100 px-3 py-2">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <Button type="submit" size="md" className="w-full" loading={loading}>
          Crear cuenta gratis
        </Button>
      </form>
    </div>
  );
}
