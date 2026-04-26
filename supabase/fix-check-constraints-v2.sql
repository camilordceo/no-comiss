-- =============================================================================
-- FIX v2: relaja los CHECK constraints SIN borrar datos
-- =============================================================================
-- El v1 fallaba porque trataba de re-crear el CHECK con valores que NO
-- cubrían filas existentes (p.ej. 'Venta' con mayúscula). Esta versión
-- simplemente DROP del CHECK sin volver a crearlo. La validación de
-- valores nuevos la hace el app (Zod en src/lib/utils/validation.ts).
--
-- Pega en https://supabase.com/dashboard/project/kkqzzdtdkrxdlfrllauy/sql/new
-- y dale RUN. No toca ninguna fila.
-- =============================================================================

-- 1. Ver qué valores existen hoy (informativo — aparece en "Notices")
DO $$
DECLARE r RECORD;
BEGIN
  RAISE NOTICE '--- Valores actuales de propiedades.tipo_negocio ---';
  FOR r IN
    SELECT tipo_negocio, COUNT(*) AS n
    FROM public.propiedades
    GROUP BY tipo_negocio
    ORDER BY n DESC
  LOOP
    RAISE NOTICE '  % (% filas)', COALESCE(r.tipo_negocio, '<null>'), r.n;
  END LOOP;

  RAISE NOTICE '--- Valores actuales de propiedades.tipo_inmueble ---';
  FOR r IN
    SELECT tipo_inmueble, COUNT(*) AS n
    FROM public.propiedades
    GROUP BY tipo_inmueble
    ORDER BY n DESC
  LOOP
    RAISE NOTICE '  % (% filas)', COALESCE(r.tipo_inmueble, '<null>'), r.n;
  END LOOP;

  RAISE NOTICE '--- Valores actuales de propiedades.source ---';
  FOR r IN
    SELECT source, COUNT(*) AS n
    FROM public.propiedades
    GROUP BY source
    ORDER BY n DESC
  LOOP
    RAISE NOTICE '  % (% filas)', COALESCE(r.source, '<null>'), r.n;
  END LOOP;

  RAISE NOTICE '--- Valores actuales de propiedades.listing_status ---';
  FOR r IN
    SELECT listing_status, COUNT(*) AS n
    FROM public.propiedades
    GROUP BY listing_status
    ORDER BY n DESC
  LOOP
    RAISE NOTICE '  % (% filas)', COALESCE(r.listing_status, '<null>'), r.n;
  END LOOP;
END $$;

-- 2. Quitar los CHECKs estrictos. NO re-creamos, así no chocan con datos viejos.
--    (la app valida los valores nuevos en src/lib/utils/validation.ts)
ALTER TABLE public.propiedades
  DROP CONSTRAINT IF EXISTS propiedades_tipo_negocio_check;

ALTER TABLE public.propiedades
  DROP CONSTRAINT IF EXISTS propiedades_tipo_inmueble_check;

ALTER TABLE public.propiedades
  DROP CONSTRAINT IF EXISTS propiedades_source_check;

ALTER TABLE public.propiedades
  DROP CONSTRAINT IF EXISTS propiedades_listing_status_check;

ALTER TABLE public.propiedad_media
  DROP CONSTRAINT IF EXISTS propiedad_media_media_type_check;

-- Listo. Las columnas siguen tipadas (text), las filas existentes intactas,
-- y el app puede insertar 'venta'/'arriendo' sin problemas.
