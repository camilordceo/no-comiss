-- =============================================================================
-- SPRINT 2 — PUBLIC MINI-SITE + LEAD/SHOWING/OFFER FORMS
-- =============================================================================
-- Pega TODO en https://supabase.com/dashboard/project/_/sql/new y dale RUN.
-- Idempotente: usa CREATE TABLE IF NOT EXISTS, CREATE OR REPLACE FUNCTION,
-- y wraps las policies en DO blocks que chequean pg_policies primero.
-- No DROPs, no DISABLE.
--
-- Crea:
--   1. Public read policies: cualquiera puede ver propiedades active/under_offer/sold
--      y su media (sin login)
--   2. Tabla `leads` (inquiry/showing/offer base) + RLS (anon insert, member read)
--   3. Tabla `citas` (showings) + RLS
--   4. Tabla `ofertas` + RLS
--   5. Tabla `notifications` (Sprint 1) si no existe
--   6. Trigger `create_lead_notifications` que inserta una notificación para
--      cada miembro de la empresa cuando se crea un lead
-- =============================================================================

-- 1. Public read on active listings ------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'propiedades' AND policyname = 'propiedades_public_active'
  ) THEN
    CREATE POLICY "propiedades_public_active"
      ON public.propiedades FOR SELECT
      TO anon, authenticated
      USING (listing_status IN ('active', 'under_offer', 'sold'));
  END IF;
END $$;

-- 2. Public read on media of public listings ---------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'propiedad_media' AND policyname = 'propiedad_media_public_via_listing'
  ) THEN
    CREATE POLICY "propiedad_media_public_via_listing"
      ON public.propiedad_media FOR SELECT
      TO anon, authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.propiedades p
          WHERE p.id = propiedad_id
            AND p.listing_status IN ('active', 'under_offer', 'sold')
        )
      );
  END IF;
END $$;

-- 3. leads -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  propiedad_interes_id uuid REFERENCES public.propiedades(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  email text NOT NULL,
  telefono text,
  origen text NOT NULL DEFAULT 'mini_site'
    CHECK (origen IN ('mini_site', 'direct_form', 'shared_link', 'ad', 'whatsapp', 'other')),
  form_type text NOT NULL CHECK (form_type IN ('inquiry', 'showing', 'offer')),
  mensaje text,
  pre_approved boolean,
  budget_range text,
  timeline text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_empresa ON public.leads(empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_propiedad ON public.leads(propiedad_interes_id);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_public_insert'
  ) THEN
    CREATE POLICY "leads_public_insert" ON public.leads
      FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_select_member'
  ) THEN
    CREATE POLICY "leads_select_member" ON public.leads
      FOR SELECT TO authenticated USING (empresa_id = public.current_empresa_id());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_update_member'
  ) THEN
    CREATE POLICY "leads_update_member" ON public.leads
      FOR UPDATE TO authenticated
      USING (empresa_id = public.current_empresa_id())
      WITH CHECK (empresa_id = public.current_empresa_id());
  END IF;
END $$;

-- 4. citas (showings) --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.citas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  propiedad_id uuid NOT NULL REFERENCES public.propiedades(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  email text NOT NULL,
  telefono text,
  preferred_date date,
  preferred_time text CHECK (preferred_time IN ('morning', 'afternoon', 'evening')),
  estado text NOT NULL DEFAULT 'programada'
    CHECK (estado IN ('programada', 'confirmada', 'cancelada', 'completada')),
  notas text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_citas_empresa ON public.citas(empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_citas_propiedad ON public.citas(propiedad_id);

ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'citas' AND policyname = 'citas_public_insert'
  ) THEN
    CREATE POLICY "citas_public_insert" ON public.citas
      FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'citas' AND policyname = 'citas_select_member'
  ) THEN
    CREATE POLICY "citas_select_member" ON public.citas
      FOR SELECT TO authenticated USING (empresa_id = public.current_empresa_id());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'citas' AND policyname = 'citas_update_member'
  ) THEN
    CREATE POLICY "citas_update_member" ON public.citas
      FOR UPDATE TO authenticated
      USING (empresa_id = public.current_empresa_id())
      WITH CHECK (empresa_id = public.current_empresa_id());
  END IF;
END $$;

-- 5. ofertas -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ofertas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  propiedad_id uuid NOT NULL REFERENCES public.propiedades(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  email text NOT NULL,
  telefono text,
  offer_price numeric NOT NULL CHECK (offer_price > 0),
  earnest_money numeric CHECK (earnest_money IS NULL OR earnest_money >= 0),
  financing text CHECK (financing IN ('cash', 'conventional', 'fha', 'va', 'other')),
  pre_approved text CHECK (pre_approved IN ('yes', 'no', 'pending')),
  closing_date date,
  contingencies text[] NOT NULL DEFAULT ARRAY[]::text[],
  notas text,
  estado text NOT NULL DEFAULT 'submitted'
    CHECK (estado IN ('submitted', 'reviewed', 'accepted', 'countered', 'rejected', 'withdrawn')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ofertas_empresa ON public.ofertas(empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ofertas_propiedad ON public.ofertas(propiedad_id);

ALTER TABLE public.ofertas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ofertas' AND policyname = 'ofertas_public_insert'
  ) THEN
    CREATE POLICY "ofertas_public_insert" ON public.ofertas
      FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ofertas' AND policyname = 'ofertas_select_member'
  ) THEN
    CREATE POLICY "ofertas_select_member" ON public.ofertas
      FOR SELECT TO authenticated USING (empresa_id = public.current_empresa_id());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ofertas' AND policyname = 'ofertas_update_member'
  ) THEN
    CREATE POLICY "ofertas_update_member" ON public.ofertas
      FOR UPDATE TO authenticated
      USING (empresa_id = public.current_empresa_id())
      WITH CHECK (empresa_id = public.current_empresa_id());
  END IF;
END $$;

-- 6. notifications (Sprint 1 — idempotent in case it wasn't run yet) ---------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'content_nudge', 'new_lead', 'showing_scheduled', 'showing_reminder',
    'offer_received', 'listing_published', 'milestone', 'system'
  )),
  title text NOT NULL,
  body text,
  action_url text,
  read boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'notifications_select_self'
  ) THEN
    CREATE POLICY "notifications_select_self" ON public.notifications
      FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'notifications_update_self'
  ) THEN
    CREATE POLICY "notifications_update_self" ON public.notifications
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 7. Trigger: fan-out notifications on lead insert ---------------------------
CREATE OR REPLACE FUNCTION public.fanout_lead_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type text;
  v_title text;
  v_action_url text;
BEGIN
  v_type := CASE NEW.form_type
    WHEN 'showing' THEN 'showing_scheduled'
    WHEN 'offer'   THEN 'offer_received'
    ELSE 'new_lead'
  END;

  v_title := CASE NEW.form_type
    WHEN 'showing' THEN NEW.nombre || ' requested a showing'
    WHEN 'offer'   THEN NEW.nombre || ' submitted an offer'
    ELSE NEW.nombre || ' is interested in your home'
  END;

  v_action_url := CASE
    WHEN NEW.propiedad_interes_id IS NOT NULL
      THEN '/dashboard/property/' || NEW.propiedad_interes_id::text
    ELSE '/dashboard'
  END;

  INSERT INTO public.notifications
    (empresa_id, user_id, type, title, body, action_url, metadata)
  SELECT
    NEW.empresa_id,
    p.id,
    v_type,
    v_title,
    NEW.email || COALESCE(' · ' || NEW.telefono, ''),
    v_action_url,
    jsonb_build_object(
      'lead_id', NEW.id,
      'propiedad_id', NEW.propiedad_interes_id,
      'form_type', NEW.form_type
    )
  FROM public.profiles p
  WHERE p.empresa_id = NEW.empresa_id;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'leads_fanout_notifications'
  ) THEN
    CREATE TRIGGER leads_fanout_notifications
      AFTER INSERT ON public.leads
      FOR EACH ROW EXECUTE FUNCTION public.fanout_lead_notifications();
  END IF;
END $$;

-- 8. Diagnóstico final -------------------------------------------------------
DO $$
DECLARE
  v_leads bool := EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='leads');
  v_citas bool := EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='citas');
  v_ofertas bool := EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ofertas');
  v_notif bool := EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='notifications');
BEGIN
  RAISE NOTICE '=== SPRINT 2 BOOTSTRAP STATUS ===';
  RAISE NOTICE 'leads:         %', CASE WHEN v_leads THEN 'OK' ELSE 'MISSING' END;
  RAISE NOTICE 'citas:         %', CASE WHEN v_citas THEN 'OK' ELSE 'MISSING' END;
  RAISE NOTICE 'ofertas:       %', CASE WHEN v_ofertas THEN 'OK' ELSE 'MISSING' END;
  RAISE NOTICE 'notifications: %', CASE WHEN v_notif THEN 'OK' ELSE 'MISSING' END;
END $$;
