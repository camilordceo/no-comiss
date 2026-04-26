-- =============================================================================
-- BOOTSTRAP ADD-ONLY — sin DROP, sin DISABLE, no destructivo
-- =============================================================================
-- Pega y corre en
--   https://supabase.com/dashboard/project/kkqzzdtdkrxdlfrllauy/sql/new
--
-- No tiene operaciones destructivas:
--  - Funciones se crean con CREATE OR REPLACE (safe)
--  - Triggers y policies se chequean primero, solo se crean si faltan
--  - Backfill INSERT solo donde no hay datos; UPDATE solo a rows con NULL
--
-- Lo que hace:
--  1. Crea helper function current_empresa_id()
--  2. Crea trigger function handle_new_profile_empresa()
--  3. Registra el trigger BEFORE INSERT en profiles si no existe
--  4. Crea profile para cada auth.user que no tenga uno
--     (el trigger del paso 3 le crea empresa automáticamente)
--  5. Para profiles que ya existían sin empresa_id, crea empresa y asocia
--  6. Asegura policies RLS necesarias (sin borrar las existentes)
--  7. Diagnóstico final
-- =============================================================================

-- 1. Helper function (CREATE OR REPLACE — safe)
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

-- 2. Trigger function (CREATE OR REPLACE — safe)
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

-- 3. Registrar el trigger en profiles solo si NO existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'profiles_bootstrap_empresa'
      AND tgrelid = 'public.profiles'::regclass
      AND NOT tgisinternal
  ) THEN
    EXECUTE 'CREATE TRIGGER profiles_bootstrap_empresa
      BEFORE INSERT ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_empresa()';
    RAISE NOTICE 'Trigger profiles_bootstrap_empresa creado.';
  ELSE
    RAISE NOTICE 'Trigger profiles_bootstrap_empresa ya existe — skip.';
  END IF;
END $$;

-- 4. Crear profile para cada auth.user sin profile
--    (el trigger del paso 3 le pondrá empresa_id automáticamente)
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

-- 5. Para profiles que ya existían sin empresa_id, crear empresa y asociar
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
  RAISE NOTICE 'Backfill: % empresas creadas y asociadas.', v_count;
END $$;

-- 6. Policies RLS necesarias para el self-heal del app
--    (solo se crean si NO existen — no toca las que ya tienes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'profiles_select_self'
      AND polrelid = 'public.profiles'::regclass
  ) THEN
    EXECUTE 'CREATE POLICY "profiles_select_self" ON public.profiles
             FOR SELECT USING (id = auth.uid())';
    RAISE NOTICE 'Policy profiles_select_self creada.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'profiles_insert_self'
      AND polrelid = 'public.profiles'::regclass
  ) THEN
    EXECUTE 'CREATE POLICY "profiles_insert_self" ON public.profiles
             FOR INSERT WITH CHECK (id = auth.uid())';
    RAISE NOTICE 'Policy profiles_insert_self creada.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'profiles_update_self'
      AND polrelid = 'public.profiles'::regclass
  ) THEN
    EXECUTE 'CREATE POLICY "profiles_update_self" ON public.profiles
             FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid())';
    RAISE NOTICE 'Policy profiles_update_self creada.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'empresas_select_member'
      AND polrelid = 'public.empresas'::regclass
  ) THEN
    EXECUTE 'CREATE POLICY "empresas_select_member" ON public.empresas
             FOR SELECT USING (id = public.current_empresa_id())';
    RAISE NOTICE 'Policy empresas_select_member creada.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'empresas_insert_authenticated'
      AND polrelid = 'public.empresas'::regclass
  ) THEN
    EXECUTE 'CREATE POLICY "empresas_insert_authenticated" ON public.empresas
             FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)';
    RAISE NOTICE 'Policy empresas_insert_authenticated creada.';
  END IF;
END $$;

-- 7. Diagnóstico final
DO $$
DECLARE
  r RECORD;
  v_users int; v_profiles int; v_with_empresa int;
BEGIN
  SELECT COUNT(*) INTO v_users FROM auth.users;
  SELECT COUNT(*) INTO v_profiles FROM public.profiles;
  SELECT COUNT(*) INTO v_with_empresa FROM public.profiles WHERE empresa_id IS NOT NULL;

  RAISE NOTICE '=== ESTADO FINAL ===';
  FOR r IN
    SELECT u.email, p.id as profile_id, p.empresa_id, e.nombre as emp_nombre
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    LEFT JOIN public.empresas e ON e.id = p.empresa_id
    ORDER BY u.created_at DESC
    LIMIT 20
  LOOP
    RAISE NOTICE '%  →  profile=%  empresa=%  (%)',
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
    RAISE WARNING 'INCONSISTENCIA — revisa el listado arriba.';
  END IF;
END $$;
