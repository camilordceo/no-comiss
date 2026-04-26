-- =============================================================================
-- FIX: profiles sin empresa_id → "Publicar inmueble" rebota a /dashboard
-- =============================================================================
-- Pega en https://supabase.com/dashboard/project/kkqzzdtdkrxdlfrllauy/sql/new
-- y dale RUN.
--
-- Qué hace (3 pasos, todo idempotente, no toca datos existentes salvo
-- llenar empresa_id donde está null):
--
--  1. Crea un trigger BEFORE INSERT en `profiles` que, si el row entrante
--     no trae empresa_id, automáticamente crea una empresa y la asocia.
--     Ya no más profiles huérfanos.
--
--  2. Backfill: para cada profile existente que tenga empresa_id NULL,
--     crea una empresa nueva y lo asocia. Cubre tu user actual de prod.
--
--  3. Agrega una INSERT policy permisiva a `empresas` por si quieres
--     crear empresas desde el cliente más adelante.
-- =============================================================================

-- 1. Trigger BEFORE INSERT — corre como SECURITY DEFINER (bypassea RLS)
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

-- 2. Backfill todos los profiles existentes que estén sin empresa
DO $$
DECLARE
  r RECORD;
  v_emp_id uuid;
  v_nombre text;
  v_count int := 0;
BEGIN
  FOR r IN
    SELECT id, nombre, email
    FROM public.profiles
    WHERE empresa_id IS NULL
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
    RAISE NOTICE 'Backfill: profile % → empresa % (%)', r.id, v_emp_id, v_nombre;
  END LOOP;

  RAISE NOTICE 'Backfill completo. % profiles actualizados.', v_count;
END $$;

-- 3. Permitir INSERT en empresas a usuarios autenticados (defensa en profundidad)
DROP POLICY IF EXISTS "empresas_insert_authenticated" ON public.empresas;
CREATE POLICY "empresas_insert_authenticated"
  ON public.empresas FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
