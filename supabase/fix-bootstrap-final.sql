-- =============================================================================
-- FIX FINAL: bootstrap completo auth.users → profiles → empresas
-- =============================================================================
-- Pega y corre en
--   https://supabase.com/dashboard/project/kkqzzdtdkrxdlfrllauy/sql/new
--
-- Lo que hace, idempotente:
--   1. Diagnóstico: cuántos auth.users hay, cuántos profiles, cuántos
--      profiles tienen empresa_id.
--   2. Trigger en `profiles` BEFORE INSERT que asegura que cada profile
--      nuevo tenga empresa_id (crea empresa automáticamente si no viene).
--   3. Trigger en `auth.users` AFTER INSERT que crea el profile cuando
--      alguien hace signup. Ese INSERT a profiles dispara el trigger
--      anterior, que crea la empresa. En cadena.
--   4. Backfill: por cada auth.user sin profile, crea uno (que dispara
--      el trigger de empresa). Cubre tu user actual de prod.
--   5. Backfill: por cada profile que SÍ existe pero está sin empresa_id,
--      crea empresa y la asocia.
--   6. Verifica que están las RLS policies que necesita el self-heal del
--      código (profiles INSERT/UPDATE self, empresas INSERT authenticated).
--   7. Diagnóstico final: deberías ver TODOS los profiles con empresa_id.
-- =============================================================================

-- 1. Diagnóstico inicial
DO $$
DECLARE v_users int; v_profiles int; v_with_empresa int;
BEGIN
  SELECT COUNT(*) INTO v_users FROM auth.users;
  SELECT COUNT(*) INTO v_profiles FROM public.profiles;
  SELECT COUNT(*) INTO v_with_empresa FROM public.profiles WHERE empresa_id IS NOT NULL;
  RAISE NOTICE '--- ANTES ---';
  RAISE NOTICE 'auth.users: %, public.profiles: %, profiles con empresa_id: %',
    v_users, v_profiles, v_with_empresa;
END $$;

-- 2. profile → empresa (BEFORE INSERT trigger)
CREATE OR REPLACE FUNCTION public.handle_new_profile_empresa()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id uuid;
  v_nombre text;
BEGIN
  IF NEW.empresa_id IS NULL THEN
    v_nombre := COALESCE(
      NULLIF(trim(NEW.nombre), ''),
      NULLIF(split_part(NEW.email, '@', 1), ''),
      'Mi inmobiliaria'
    );
    INSERT INTO public.empresas (nombre, plan, activa)
    VALUES (v_nombre, 'free', true)
    RETURNING id INTO v_empresa_id;
    NEW.empresa_id := v_empresa_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_bootstrap_empresa ON public.profiles;
CREATE TRIGGER profiles_bootstrap_empresa
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_empresa();

-- 3. auth.users → profile (AFTER INSERT trigger en auth.users)
--    Necesita SECURITY DEFINER para escribir a public.profiles.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'nombre',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. Backfill: auth.users sin profile → crear profile (dispara trigger de empresa)
DO $$
DECLARE r RECORD; v_count int := 0;
BEGIN
  FOR r IN
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE p.id IS NULL AND u.email IS NOT NULL
  LOOP
    INSERT INTO public.profiles (id, email, nombre)
    VALUES (
      r.id,
      r.email,
      COALESCE(
        r.raw_user_meta_data->>'nombre',
        r.raw_user_meta_data->>'full_name',
        r.raw_user_meta_data->>'name'
      )
    );
    v_count := v_count + 1;
    RAISE NOTICE '+ Profile creado para auth user %', r.id;
  END LOOP;
  RAISE NOTICE 'Backfill profiles: % filas creadas.', v_count;
END $$;

-- 5. Backfill: profiles ya existentes pero sin empresa_id
DO $$
DECLARE
  r RECORD;
  v_emp_id uuid;
  v_nombre text;
  v_count int := 0;
BEGIN
  FOR r IN SELECT id, nombre, email FROM public.profiles WHERE empresa_id IS NULL
  LOOP
    v_nombre := COALESCE(
      NULLIF(trim(r.nombre), ''),
      NULLIF(split_part(r.email, '@', 1), ''),
      'Mi inmobiliaria'
    );
    INSERT INTO public.empresas (nombre, plan, activa)
    VALUES (v_nombre, 'free', true)
    RETURNING id INTO v_emp_id;
    UPDATE public.profiles SET empresa_id = v_emp_id WHERE id = r.id;
    v_count := v_count + 1;
    RAISE NOTICE '+ Empresa % asociada a profile %', v_emp_id, r.id;
  END LOOP;
  RAISE NOTICE 'Backfill empresas: % filas actualizadas.', v_count;
END $$;

-- 6. RLS policies que necesita el self-heal del código (idempotentes)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "empresas_insert_authenticated" ON public.empresas;
CREATE POLICY "empresas_insert_authenticated"
  ON public.empresas FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 7. Diagnóstico final
DO $$
DECLARE v_users int; v_profiles int; v_with_empresa int;
BEGIN
  SELECT COUNT(*) INTO v_users FROM auth.users;
  SELECT COUNT(*) INTO v_profiles FROM public.profiles;
  SELECT COUNT(*) INTO v_with_empresa FROM public.profiles WHERE empresa_id IS NOT NULL;
  RAISE NOTICE '--- DESPUÉS ---';
  RAISE NOTICE 'auth.users: %, public.profiles: %, profiles con empresa_id: %',
    v_users, v_profiles, v_with_empresa;
  IF v_users = v_profiles AND v_profiles = v_with_empresa THEN
    RAISE NOTICE 'OK: todos los users tienen profile + empresa.';
  ELSE
    RAISE WARNING 'INCONSISTENCIA: revisa los conteos arriba.';
  END IF;
END $$;
