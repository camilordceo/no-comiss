-- =============================================================================
-- SPRINT 3 — CRM (lead status pipeline + seller notes)
-- =============================================================================
-- Pega TODO en https://supabase.com/dashboard/project/_/sql/new y dale RUN.
-- Idempotente: ALTER ... ADD COLUMN IF NOT EXISTS, DROP/ADD CHECK con guard.
-- =============================================================================

-- 1. leads.status (pipeline stage) ------------------------------------------
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_status_check'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_status_check
      CHECK (status IN ('new', 'contacted', 'qualified', 'showing', 'offer', 'won', 'lost'));
  END IF;
END $$;

-- 2. leads.seller_notes (free-form notes from the seller) -------------------
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS seller_notes text;

-- 3. ensure helpful indexes -------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON public.citas(empresa_id, estado, preferred_date);
CREATE INDEX IF NOT EXISTS idx_ofertas_estado ON public.ofertas(empresa_id, estado);

-- 4. diagnostic -------------------------------------------------------------
DO $$
DECLARE
  v_status_col bool;
  v_notes_col bool;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='leads' AND column_name='status'
  ) INTO v_status_col;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='leads' AND column_name='seller_notes'
  ) INTO v_notes_col;

  RAISE NOTICE '=== SPRINT 3 BOOTSTRAP STATUS ===';
  RAISE NOTICE 'leads.status:        %', CASE WHEN v_status_col THEN 'OK' ELSE 'MISSING' END;
  RAISE NOTICE 'leads.seller_notes:  %', CASE WHEN v_notes_col THEN 'OK' ELSE 'MISSING' END;
END $$;
