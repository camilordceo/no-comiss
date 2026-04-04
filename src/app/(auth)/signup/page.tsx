import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create Account" };

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block font-bold text-2xl text-foreground">
            <span className="text-primary">No</span>Comiss
          </Link>
          <p className="text-gray-500 text-sm mt-2">
            First week free &middot; No credit card required
          </p>
        </div>

        <div className="bg-white rounded-[12px] border border-border shadow-sm p-6">
          <h1 className="text-lg font-semibold text-foreground mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-5">Start selling your home with AI today.</p>
          <SignupForm />
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-4">
          By signing up you agree to our{" "}
          <Link href="/terms" className="underline hover:text-gray-600">Terms</Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
