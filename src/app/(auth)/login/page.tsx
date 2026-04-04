import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block font-bold text-2xl text-foreground">
            <span className="text-primary">No</span>Comiss
          </Link>
          <p className="text-gray-500 text-sm mt-2">Welcome back</p>
        </div>

        <div className="bg-white rounded-[12px] border border-border shadow-sm p-6">
          <h1 className="text-lg font-semibold text-foreground mb-5">Sign in to your account</h1>
          <LoginForm />
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Start selling for free
          </Link>
        </p>
      </div>
    </div>
  );
}
