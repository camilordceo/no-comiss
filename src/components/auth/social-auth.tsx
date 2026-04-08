"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SocialAuth() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  async function signInWithFacebook() {
    setLoadingProvider("facebook");
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "email,public_profile",
      },
    });
    // Page will redirect; no need to reset loading state
  }

  return (
    <div className="space-y-3">
      {/* Facebook / Instagram */}
      <button
        type="button"
        onClick={signInWithFacebook}
        disabled={loadingProvider !== null}
        className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-[8px] border border-border bg-white text-sm font-medium text-foreground hover:bg-surface active:bg-[#e8e8e8] transition-colors disabled:opacity-50 disabled:pointer-events-none"
      >
        {loadingProvider === "facebook" ? (
          <svg className="animate-spin h-4 w-4 text-[#1877F2]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        )}
        Continue with Facebook
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-white text-gray-400">or continue with email</span>
        </div>
      </div>
    </div>
  );
}
