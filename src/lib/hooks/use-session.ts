import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database, Profile, Empresa, Propiedad } from "@/lib/types/database";
import { logger } from "@/lib/utils/logger";

export interface DashboardSession {
  userId: string;
  email: string;
  profile: Profile;
  empresa: Empresa | null;
  primaryProperty: Propiedad | null;
}

type Client = SupabaseClient<Database>;

function nameFromUser(user: User, existingNombre?: string | null): string | null {
  if (existingNombre && existingNombre.trim()) return existingNombre;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const candidates = [meta.nombre, meta.full_name, meta.name];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return null;
}

/**
 * Self-heal: if the authenticated user is missing a profile row OR the row
 * exists but has no empresa_id, create what's needed using the user's own
 * authenticated client. RLS policies (profiles_insert_self, profiles_update_self,
 * empresas_insert_authenticated) make this safe.
 *
 * Idempotent. Returns the profile (with empresa_id filled) and the empresa
 * row, or null if it couldn't recover.
 */
async function selfHealSession(
  supabase: Client,
  user: User,
  existingProfile: Profile | null,
): Promise<{ profile: Profile; empresa: Empresa | null } | null> {
  const userEmail = user.email ?? existingProfile?.email ?? "";
  const nombre = nameFromUser(user, existingProfile?.nombre);

  // Step 1: ensure a profile row exists. UPSERT on id.
  // The BEFORE INSERT trigger on profiles will fill empresa_id automatically
  // if this is a fresh insert. UPDATE path won't trigger it, so we handle
  // that case in step 2.
  const { data: profile, error: upsertErr } = await supabase
    .from("profiles")
    .upsert(
      { id: user.id, email: userEmail, nombre: nombre ?? null },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (upsertErr || !profile) {
    logger.error("session.bootstrap_profile_upsert_failed", {
      userId: user.id,
      message: upsertErr?.message,
    });
    return null;
  }

  // Step 2: if the profile has empresa_id, fetch the empresa and we're done.
  if (profile.empresa_id) {
    const { data: empresa } = await supabase
      .from("empresas")
      .select("*")
      .eq("id", profile.empresa_id)
      .maybeSingle();
    return { profile: profile as Profile, empresa: empresa ?? null };
  }

  // Step 3: profile exists but no empresa_id. Create empresa and link it.
  const empresaName =
    (nombre ?? userEmail.split("@")[0] ?? "Mi inmobiliaria").trim() || "Mi inmobiliaria";

  const { data: empresa, error: empresaErr } = await supabase
    .from("empresas")
    .insert({ nombre: empresaName, plan: "free", activa: true })
    .select("*")
    .single();

  if (empresaErr || !empresa) {
    logger.error("session.bootstrap_empresa_insert_failed", {
      userId: user.id,
      message: empresaErr?.message,
    });
    return { profile: profile as Profile, empresa: null };
  }

  const { data: linkedProfile, error: linkErr } = await supabase
    .from("profiles")
    .update({ empresa_id: empresa.id })
    .eq("id", user.id)
    .select("*")
    .single();

  if (linkErr || !linkedProfile) {
    logger.error("session.bootstrap_profile_link_failed", {
      userId: user.id,
      message: linkErr?.message,
    });
    return { profile: profile as Profile, empresa: empresa as Empresa };
  }

  logger.info("session.bootstrapped", {
    userId: user.id,
    empresaId: empresa.id,
  });

  return { profile: linkedProfile as Profile, empresa: empresa as Empresa };
}

/**
 * Server-only helper. Loads the authenticated user's profile, empresa, and most-recent propiedad.
 * Redirects to /login if not authenticated. Self-heals missing profile/empresa rows on the fly.
 */
export async function requireDashboardSession(): Promise<DashboardSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: fetchedProfile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr) {
    logger.error("session.profile_fetch_failed", {
      userId: user.id,
      message: profileErr.message,
    });
  }

  let profile: Profile | null = (fetchedProfile as Profile | null) ?? null;
  let empresa: Empresa | null = null;

  // Bootstrap if missing profile or missing empresa link
  if (!profile || !profile.empresa_id) {
    logger.info("session.attempting_bootstrap", {
      userId: user.id,
      hasProfile: !!profile,
      hasEmpresaId: !!profile?.empresa_id,
    });
    const healed = await selfHealSession(supabase, user, profile);
    if (healed) {
      profile = healed.profile;
      empresa = healed.empresa;
    }
  }

  if (!profile) {
    // Bootstrap failed (probably an RLS policy is missing).
    // Return a fallback so the layout still renders, but downstream pages
    // that need empresa_id will surface a clear error instead of crashing.
    logger.warn("session.profile_missing_returning_fallback", { userId: user.id });
    return {
      userId: user.id,
      email: user.email ?? "",
      profile: {
        id: user.id,
        email: user.email ?? "",
        nombre: nameFromUser(user),
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

  // Fetch empresa if we have empresa_id but didn't pull it during bootstrap
  if (profile.empresa_id && !empresa) {
    const { data, error } = await supabase
      .from("empresas")
      .select("*")
      .eq("id", profile.empresa_id)
      .maybeSingle();
    if (error) {
      logger.error("session.empresa_fetch_failed", {
        id: profile.empresa_id,
        message: error.message,
      });
    }
    empresa = data ?? null;
  }

  // Fetch most-recent propiedad if we have empresa
  let primaryProperty: Propiedad | null = null;
  if (profile.empresa_id) {
    const { data, error } = await supabase
      .from("propiedades")
      .select("*")
      .eq("empresa_id", profile.empresa_id)
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
