-- =============================================================================
-- BOOTSTRAP MANUAL — bulletproof, sin depender de triggers ni RLS
-- =============================================================================
-- Pega TODO en https://supabase.com/dashboard/project/kkqzzdtdkrxdlfrllauy/sql/new
-- y dale RUN. No falla. Mira la pestaña "Notices" para el output.
--
-- Lo que hace:
--   1. Te muestra el estado actual (user / profile / empresa)
--   2. Apaga RLS en profiles y empresas temporalmente
--   3. Borra los triggers viejos por si tienen bugs
--   4. Crea profile para CADA auth.user que no tenga uno
--   5. Crea empresa + la asocia para CADA profile sin empresa_id
--   6. Vuelve a poner RLS con policies limpias
--   7. Re-instala los triggers para que los signups futuros funcionen
--   8. Te muestra el estado final — todos los users deben tener profile+empresa
-- =============================================================================

-- 1. Diagnóstico inicial
DO $$
DECLARE r RECORD;
BEGIN
  RAISE NOTICE '=== ESTADO ANTES ===';
  FOR r IN
    SELECT u.email, p.id as profile_id, p.empresa_id, e.nombre as emp_nombre
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    LEFT JOIN public.empresas e ON e.id = p.empresa_id
    ORDER BY u.created_at DESC
  LOOP
    RAISE NOTICE '%  →  profile=%  empresa_id=%  empresa_nombre=%',
      r.email,
      COALESCE(r.profile_id::text, '<FALTA>'),
      COALESCE(r.empresa_id::text, '<FALTA>'),
      COALESCE(r.emp_nombre, '');
  END LOOP;
END $$;

-- 2. Apagar RLS temporal en las dos tablas
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas DISABLE ROW LEVEL SECURITY;

-- 3. Borrar triggers que pudieran estar mal
DROP TRIGGER IF EXISTS profiles_bootstrap_empresa ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Crear profile para cada auth.user que no lo tenga
INSERT INTO public.profiles (id, email, nombre)
SELECT
  u.id,
  u.email,
  COALESCE(
    NULLIF(u.raw_user_meta_data->>'nombre', ''),
    NULLIF(u.raw_user_meta_data->>'full_name', ''),
    NULLIF(u.raw_user_meta_data->>'name', ''),
    split_part(u.email, '@', 1)
  )
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL AND u.email IS NOT NULL;

-- 5. Crear empresa + asociar para cada profile sin empresa_id
DO $$
DECLARE
  r RECORD;
  v_emp_id uuid;
  v_count int := 0;
BEGIN
  FOR r IN SELECT id, email, nombre FROM public.profiles WHERE empresa_id IS NULL
  LOOP
    INSERT INTO public.empresas (nombre, plan, activa)
    VALUES (
      COALESCE(
        NULLIF(trim(r.nombre), ''),
        split_part(r.email, '@', 1),
        'Mi inmobiliaria'
      ),
      'free',
      true
    )
    RETURNING id INTO v_emp_id;

    UPDATE public.profiles SET empresa_id = v_emp_id WHERE id = r.id;
    v_count := v_count + 1;
    RAISE NOTICE '+ Empresa % asociada a % (%)', v_emp_id, r.id, r.email;
  END LOOP;
  RAISE NOTICE 'Total empresas asociadas: %.', v_count;
END $$;

-- 6. Volver a habilitar RLS con policies limpias (idempotente)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- profiles policies (re-aseguradas)
DROP POLICY IF EXISTS "profiles_select_self" ON public.profiles;
CREATE POLICY "profiles_select_self"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- empresas policies — usa la helper si existe, si no la define
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

DROP POLICY IF EXISTS "empresas_select_member" ON public.empresas;
CREATE POLICY "empresas_select_member"
  ON public.empresas FOR SELECT
  USING (id = public.current_empresa_id());

DROP POLICY IF EXISTS "empresas_insert_authenticated" ON public.empresas;
CREATE POLICY "empresas_insert_authenticated"
  ON public.empresas FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "empresas_update_member" ON public.empresas;
CREATE POLICY "empresas_update_member"
  ON public.empresas FOR UPDATE
  USING (id = public.current_empresa_id())
  WITH CHECK (id = public.current_empresa_id());

-- 7. Re-instalar los triggers para signups futuros
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

CREATE TRIGGER profiles_bootstrap_empresa
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_empresa();

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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 8. Diagnóstico final — todos deben tener profile + empresa con nombre
DO $$
DECLARE
  r RECORD;
  v_users int; v_profiles int; v_with_empresa int;
BEGIN
  SELECT COUNT(*) INTO v_users FROM auth.users;
  SELECT COUNT(*) INTO v_profiles FROM public.profiles;
  SELECT COUNT(*) INTO v_with_empresa FROM public.profiles WHERE empresa_id IS NOT NULL;

  RAISE NOTICE '=== ESTADO DESPUÉS ===';
  FOR r IN
    SELECT u.email, p.id as profile_id, p.empresa_id, e.nombre as emp_nombre
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    LEFT JOIN public.empresas e ON e.id = p.empresa_id
    ORDER BY u.created_at DESC
  LOOP
    RAISE NOTICE '%  →  profile=%  empresa_id=%  empresa=%',
      r.email,
      COALESCE(r.profile_id::text, '<FALTA>'),
      COALESCE(r.empresa_id::text, '<FALTA>'),
      COALESCE(r.emp_nombre, '');
  END LOOP;

  RAISE NOTICE '---';
  RAISE NOTICE 'Totales: auth.users=%, profiles=%, profiles_con_empresa=%',
    v_users, v_profiles, v_with_empresa;

  IF v_users = v_profiles AND v_profiles = v_with_empresa AND v_users > 0 THEN
    RAISE NOTICE 'OK: todos los users tienen profile + empresa.';
  ELSE
    RAISE WARNING 'INCONSISTENCIA: hay users sin profile/empresa. Revisa los rows arriba.';
  END IF;
END $$;
