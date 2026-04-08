-- ============================================================
-- NoComiss – Schema Additions
-- Run this AFTER supabase-schema.sql
-- ============================================================

-- ============================================================
-- PAYMENTS
-- Tracks every Wompi transaction attempt
-- ============================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wompi_transaction_id TEXT,                  -- filled once Wompi confirms
  wompi_reference TEXT NOT NULL UNIQUE,       -- our generated reference
  amount_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'declined', 'voided', 'error')),
  plan_id TEXT NOT NULL
    CHECK (plan_id IN ('starter', 'pro', 'elite')),
  plan_name TEXT NOT NULL,
  wompi_data JSONB,                           -- full Wompi transaction payload
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX payments_user_id_idx ON payments(user_id);
CREATE INDEX payments_reference_idx ON payments(wompi_reference);
CREATE INDEX payments_status_idx ON payments(status);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own payments
CREATE POLICY "Users can read own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update (via API routes)
CREATE POLICY "Service role can manage payments" ON payments
  FOR ALL USING (true);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- USER MEDIA
-- Every image/video/document a user uploads, linked to their
-- profile and optionally to a specific listing
-- ============================================================
CREATE TABLE user_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,  -- nullable
  media_type TEXT NOT NULL
    CHECK (media_type IN ('photo', 'video', 'document', 'avatar')),
  bucket TEXT NOT NULL,          -- storage bucket name
  storage_path TEXT NOT NULL,    -- path inside bucket
  public_url TEXT,               -- pre-computed public URL (null for private buckets)
  file_name TEXT NOT NULL,
  file_size BIGINT,              -- bytes
  mime_type TEXT,
  width INTEGER,                 -- pixels (images only)
  height INTEGER,
  duration_seconds INTEGER,      -- seconds (videos only)
  metadata JSONB DEFAULT '{}',   -- any extra data (alt text, tags, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX user_media_user_id_idx ON user_media(user_id);
CREATE INDEX user_media_listing_id_idx ON user_media(listing_id);
CREATE INDEX user_media_type_idx ON user_media(media_type);

ALTER TABLE user_media ENABLE ROW LEVEL SECURITY;

-- Users manage their own media
CREATE POLICY "Users can manage own media" ON user_media
  FOR ALL USING (auth.uid() = user_id);

-- Public can view photos/videos (for listing pages)
CREATE POLICY "Public can view non-private media" ON user_media
  FOR SELECT USING (media_type IN ('photo', 'video'));

-- ============================================================
-- STORAGE: user-avatars bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('user-avatars', 'user-avatars', true, 5242880,
   ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can update/delete own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- PROFILES: add OAuth provider column
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email'
    CHECK (provider IN ('email', 'facebook', 'google'));

-- ============================================================
-- FUNCTION: auto-populate provider from auth metadata
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_provider TEXT;
BEGIN
  -- Detect OAuth provider
  v_provider := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    'email'
  );

  INSERT INTO profiles (id, email, full_name, avatar_url, provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    v_provider
  )
  ON CONFLICT (id) DO UPDATE
    SET
      full_name = COALESCE(
        EXCLUDED.full_name,
        profiles.full_name
      ),
      avatar_url = COALESCE(
        EXCLUDED.avatar_url,
        profiles.avatar_url
      ),
      provider = EXCLUDED.provider,
      updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach the trigger (DROP first to replace cleanly)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
