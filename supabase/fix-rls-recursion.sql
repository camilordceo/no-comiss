-- =============================================================================
-- FIX: "infinite recursion detected in policy for relation profiles"
-- =============================================================================
-- Pega TODO esto en el SQL Editor de Supabase y dale RUN:
--   https://supabase.com/dashboard/project/kkqzzdtdkrxdlfrllauy/sql/new
--
-- Qué hace:
--  1. Crea una helper function `current_empresa_id()` con SECURITY DEFINER
--     que lee profiles SIN disparar RLS (rompe el ciclo de recursión).
--  2. Borra todas las policies actuales de profiles, empresas, propiedades
--     y propiedad_media, y las reemplaza con un set simple multi-tenant
--     usando la helper function.
--
-- Es seguro correrlo varias veces (DROP IF EXISTS + CREATE).
-- =============================================================================

-- 1. Helper function — bypassea RLS para no causar recursión
CREATE OR REPLACE FUNCTION public.current_empresa_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.current_empresa_id() TO authenticated, anon, service_role;

-- 2. profiles — simple, sin subqueries que vuelvan a profiles
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT polname FROM pg_policy WHERE polrelid = 'public.profiles'::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.polname);
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_self"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_self"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 3. empresas — el usuario solo ve la empresa a la que pertenece
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT polname FROM pg_policy WHERE polrelid = 'public.empresas'::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.empresas', r.polname);
  END LOOP;
END $$;

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresas_select_member"
  ON public.empresas FOR SELECT
  USING (id = public.current_empresa_id());

CREATE POLICY "empresas_update_member"
  ON public.empresas FOR UPDATE
  USING (id = public.current_empresa_id())
  WITH CHECK (id = public.current_empresa_id());

-- 4. propiedades — todo (CRUD) limitado a la empresa del usuario
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT polname FROM pg_policy WHERE polrelid = 'public.propiedades'::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.propiedades', r.polname);
  END LOOP;
END $$;

ALTER TABLE public.propiedades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "propiedades_all_member"
  ON public.propiedades FOR ALL
  USING (empresa_id = public.current_empresa_id())
  WITH CHECK (empresa_id = public.current_empresa_id());

-- 5. propiedad_media — igual que propiedades
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT polname FROM pg_policy WHERE polrelid = 'public.propiedad_media'::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.propiedad_media', r.polname);
  END LOOP;
END $$;

ALTER TABLE public.propiedad_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "propiedad_media_all_member"
  ON public.propiedad_media FOR ALL
  USING (empresa_id = public.current_empresa_id())
  WITH CHECK (empresa_id = public.current_empresa_id());

-- =============================================================================
-- BONUS: si tu trigger de signup no está creando el row en `empresas`,
-- corre esto UNA SOLA VEZ con tu user_id (el que aparece en los logs):
--   266dc4dc-82cb-4169-8ead-46a440352dab
-- =============================================================================
DO $$
DECLARE
  v_user_id uuid := '266dc4dc-82cb-4169-8ead-46a440352dab';
  v_empresa_id uuid;
  v_existing_empresa uuid;
BEGIN
  -- Si el profile ya tiene empresa_id, no hacemos nada
  SELECT empresa_id INTO v_existing_empresa FROM public.profiles WHERE id = v_user_id;

  IF v_existing_empresa IS NOT NULL THEN
    RAISE NOTICE 'Profile ya tiene empresa_id = %. Skipping.', v_existing_empresa;
  ELSE
    -- Crea una empresa para este user
    INSERT INTO public.empresas (nombre, plan, activa)
    VALUES ('Mi inmobiliaria', 'free', true)
    RETURNING id INTO v_empresa_id;

    -- Asocia el profile a la empresa
    UPDATE public.profiles
    SET empresa_id = v_empresa_id
    WHERE id = v_user_id;

    RAISE NOTICE 'Empresa creada (%) y asociada al user.', v_empresa_id;
  END IF;
END $$;
