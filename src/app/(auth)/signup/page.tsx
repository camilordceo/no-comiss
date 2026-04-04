import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block font-bold text-2xl text-foreground">
            <span className="text-primary">No</span>Comiss
          </Link>
          <p className="text-gray-500 text-sm mt-2">
            Primera semana gratis · Sin tarjeta de crédito
          </p>
        </div>

        <div className="bg-white rounded-[12px] border border-border shadow-sm p-6">
          <SignupForm />
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Iniciar sesión
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-4">
          Al registrarte aceptas nuestros{" "}
          <Link href="/terminos" className="underline hover:text-gray-600">
            Términos
          </Link>{" "}
          y{" "}
          <Link href="/privacidad" className="underline hover:text-gray-600">
            Política de privacidad
          </Link>
        </p>
      </div>
    </div>
  );
}
