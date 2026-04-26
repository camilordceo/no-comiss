-- =============================================================================
-- FIX: "propiedades_tipo_negocio_check" + cualquier otra CHECK demasiado estricta
-- =============================================================================
-- Pega esto en https://supabase.com/dashboard/project/kkqzzdtdkrxdlfrllauy/sql/new
-- y dale RUN.
--
-- Qué hace:
--  1. Inspecciona qué CHECK constraints hay actualmente en `propiedades`
--     (verás el listado en la pestaña "Notices" abajo a la derecha).
--  2. Borra los CHECKs sobre `tipo_negocio`, `tipo_inmueble` y `source`
--     y los reemplaza por reglas permisivas que aceptan los valores que
--     mandamos desde el app:
--       tipo_negocio: 'venta' | 'arriendo'
--       tipo_inmueble: cualquier string
--       source: cualquier string
-- =============================================================================

-- 1. Ver qué CHECKs hay (informativo)
DO $$
DECLARE r RECORD;
BEGIN
  RAISE NOTICE 'CHECK constraints actuales en public.propiedades:';
  FOR r IN
    SELECT conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid = 'public.propiedades'::regclass
      AND contype = 'c'
  LOOP
    RAISE NOTICE '  % :: %', r.conname, r.def;
  END LOOP;
END $$;

-- 2. tipo_negocio: aceptar venta + arriendo (lowercase, sin tildes)
ALTER TABLE public.propiedades
  DROP CONSTRAINT IF EXISTS propiedades_tipo_negocio_check;

ALTER TABLE public.propiedades
  ADD CONSTRAINT propiedades_tipo_negocio_check
  CHECK (tipo_negocio IS NULL OR tipo_negocio IN ('venta', 'arriendo'));

-- 3. tipo_inmueble: liberar (almacenamos apartamento, casa, apartaestudio, etc)
ALTER TABLE public.propiedades
  DROP CONSTRAINT IF EXISTS propiedades_tipo_inmueble_check;

-- 4. source: liberar (mandamos 'rentmies', podría haber 'manual', 'import', etc)
ALTER TABLE public.propiedades
  DROP CONSTRAINT IF EXISTS propiedades_source_check;

-- 5. listing_status: asegurar que acepta los estados que usamos
ALTER TABLE public.propiedades
  DROP CONSTRAINT IF EXISTS propiedades_listing_status_check;

ALTER TABLE public.propiedades
  ADD CONSTRAINT propiedades_listing_status_check
  CHECK (
    listing_status IS NULL OR listing_status IN (
      'draft', 'onboarding', 'ready', 'active',
      'paused', 'under_offer', 'sold', 'expired'
    )
  );

-- 6. propiedad_media.media_type
ALTER TABLE public.propiedad_media
  DROP CONSTRAINT IF EXISTS propiedad_media_media_type_check;

ALTER TABLE public.propiedad_media
  ADD CONSTRAINT propiedad_media_media_type_check
  CHECK (media_type IN ('photo', 'video', 'virtual_tour'));
