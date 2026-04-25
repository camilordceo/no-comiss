import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Empresa, Propiedad } from "@/lib/types/database";
import { logger } from "@/lib/utils/logger";

export interface DashboardSession {
  userId: string;
  email: string;
  profile: Profile;
  empresa: Empresa | null;
  primaryProperty: Propiedad | null;
}

/**
 * Server-only helper. Loads the authenticated user's profile, empresa, and most-recent propiedad.
 * Redirects to /login if not authenticated.
 */
export async function requireDashboardSession(): Promise<DashboardSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr) {
    logger.error("session.profile_fetch_failed", { userId: user.id, message: profileErr.message });
  }

  if (!profile) {
    logger.warn("session.profile_missing", { userId: user.id });
    return {
      userId: user.id,
      email: user.email ?? "",
      profile: {
        id: user.id,
        email: user.email ?? "",
        nombre: (user.user_metadata?.nombre as string) ?? null,
        rol: null,
        empresa_id: null,
        avatar_url: null,
        plan: null,
        onboarding_completed: false,
        metadata: null,
        created_at: new Date().toISOString(),
        updated_at: null,
      },
      empresa: null,
      primaryProperty: null,
    };
  }

  let empresa: Empresa | null = null;
  if (profile.empresa_id) {
    const { data, error } = await supabase
      .from("empresas")
      .select("*")
      .eq("id", profile.empresa_id)
      .maybeSingle();
    if (error) {
      logger.error("session.empresa_fetch_failed", { id: profile.empresa_id, message: error.message });
    }
    empresa = data ?? null;
  }

  let primaryProperty: Propiedad | null = null;
  if (profile.empresa_id) {
    const { data, error } = await supabase
      .from("propiedades")
      .select("*")
      .eq("empresa_id", profile.empresa_id)
      .eq("source", "nocomiss")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      logger.error("session.property_fetch_failed", { message: error.message });
    }
    primaryProperty = data ?? null;
  }

  return {
    userId: user.id,
    email: user.email ?? profile.email,
    profile,
    empresa,
    primaryProperty,
  };
}
