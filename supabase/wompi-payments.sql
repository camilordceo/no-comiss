-- =============================================================================
-- WOMPI PAYMENTS — schema additions for one-time + recurring billing
-- =============================================================================
-- Paste in https://supabase.com/dashboard/project/_/sql/new and RUN.
-- Idempotent: every statement uses IF NOT EXISTS / DO blocks. No drops.
-- =============================================================================

-- 1. profiles: subscription tracking ----------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS subscription_plan text,
  ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_next_billing_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_cancelled_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_subscription_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_subscription_status_check
      CHECK (subscription_status IN ('none', 'trial', 'active', 'past_due', 'cancelled'));
  END IF;
END $$;

-- 2. payment_sources: tokenized cards for recurring -------------------------
CREATE TABLE IF NOT EXISTS public.payment_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wompi_payment_source_id integer,
  card_last_four text,
  card_brand text,
  is_default boolean DEFAULT false,
  is_three_ds boolean DEFAULT false,
  status text DEFAULT 'AVAILABLE',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_sources
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS wompi_payment_source_id integer,
  ADD COLUMN IF NOT EXISTS card_last_four text,
  ADD COLUMN IF NOT EXISTS card_brand text,
  ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_three_ds boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'AVAILABLE',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_sources_status_check'
  ) THEN
    ALTER TABLE public.payment_sources
      ADD CONSTRAINT payment_sources_status_check
      CHECK (status IN ('AVAILABLE', 'PENDING', 'DECLINED', 'ERROR'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_sources_user
  ON public.payment_sources(user_id);

-- 3. wompi_transactions: full transaction history ---------------------------
CREATE TABLE IF NOT EXISTS public.wompi_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wompi_transaction_id text,
  reference text NOT NULL UNIQUE,
  amount_in_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'COP',
  status text NOT NULL DEFAULT 'PENDING',
  payment_source_id uuid REFERENCES public.payment_sources(id) ON DELETE SET NULL,
  payment_method_type text,
  plan text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- additive columns in case the table existed already
ALTER TABLE public.wompi_transactions
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS wompi_transaction_id text,
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS amount_in_cents bigint,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'COP',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS payment_source_id uuid,
  ADD COLUMN IF NOT EXISTS payment_method_type text,
  ADD COLUMN IF NOT EXISTS plan text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wompi_transactions_reference_unique'
  ) THEN
    BEGIN
      ALTER TABLE public.wompi_transactions
        ADD CONSTRAINT wompi_transactions_reference_unique UNIQUE (reference);
    EXCEPTION WHEN duplicate_table THEN
      NULL;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wompi_tx_user
  ON public.wompi_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wompi_tx_reference
  ON public.wompi_transactions(reference);

-- 4. billing-cron index on profiles -----------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_billing_due
  ON public.profiles(subscription_next_billing_at)
  WHERE subscription_status = 'active';

-- 5. RLS — users see only their own --------------------------------------------
ALTER TABLE public.payment_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wompi_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='payment_sources'
      AND policyname='nocomiss_users_own_payment_sources'
  ) THEN
    CREATE POLICY "nocomiss_users_own_payment_sources"
      ON public.payment_sources
      FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='wompi_transactions'
      AND policyname='nocomiss_users_own_transactions'
  ) THEN
    CREATE POLICY "nocomiss_users_own_transactions"
      ON public.wompi_transactions
      FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 6. diagnostic --------------------------------------------------------------
DO $$
DECLARE
  v_ps_status bool;
  v_tx_ref bool;
  v_sub_col bool;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='payment_sources' AND column_name='status'
  ) INTO v_ps_status;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='wompi_transactions' AND column_name='reference'
  ) INTO v_tx_ref;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='subscription_status'
  ) INTO v_sub_col;

  RAISE NOTICE '=== WOMPI PAYMENTS BOOTSTRAP STATUS ===';
  RAISE NOTICE 'payment_sources.status:           %', CASE WHEN v_ps_status THEN 'OK' ELSE 'MISSING' END;
  RAISE NOTICE 'wompi_transactions.reference:     %', CASE WHEN v_tx_ref THEN 'OK' ELSE 'MISSING' END;
  RAISE NOTICE 'profiles.subscription_status:     %', CASE WHEN v_sub_col THEN 'OK' ELSE 'MISSING' END;
END $$;
