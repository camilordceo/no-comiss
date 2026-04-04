import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block font-bold text-2xl text-foreground">
            <span className="text-primary">No</span>Comiss
          </Link>
          <p className="text-gray-500 text-sm mt-2">Bienvenido de vuelta</p>
        </div>

        <div className="bg-white rounded-[12px] border border-border shadow-sm p-6">
          <LoginForm />
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          ¿No tienes cuenta?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
