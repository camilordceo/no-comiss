-- NoComiss Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  subscription_tier TEXT CHECK (subscription_tier IN ('starter', 'pro', 'elite')),
  subscription_status TEXT CHECK (subscription_status IN ('active', 'past_due', 'cancelled')),
  subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- LISTINGS
-- ============================================================
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'sold', 'expired')),
  property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'house', 'studio', 'commercial', 'land')),
  title TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  price NUMERIC NOT NULL,
  area_m2 NUMERIC NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  parking INTEGER DEFAULT 0,
  floor INTEGER,
  stratum INTEGER CHECK (stratum BETWEEN 1 AND 6),
  amenities TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  video_url TEXT,
  rentcast_data JSONB,
  ai_descriptions JSONB,
  selected_description_idx INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0 NOT NULL,
  leads_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  published_at TIMESTAMPTZ
);

CREATE INDEX listings_user_id_idx ON listings(user_id);
CREATE INDEX listings_slug_idx ON listings(slug);
CREATE INDEX listings_status_idx ON listings(status);
CREATE INDEX listings_city_idx ON listings(city);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Owners can manage their listings
CREATE POLICY "Owners can manage own listings" ON listings
  FOR ALL USING (auth.uid() = user_id);

-- Public can read active listings
CREATE POLICY "Public can read active listings" ON listings
  FOR SELECT USING (status = 'active');

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- LEADS
-- ============================================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'showing_scheduled', 'offer_made', 'closed', 'lost')),
  source TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'whatsapp', 'instagram', 'facebook', 'portal')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX leads_listing_id_idx ON leads(listing_id);
CREATE INDEX leads_user_id_idx ON leads(user_id);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listing owners can manage leads" ON leads FOR ALL USING (auth.uid() = user_id);
-- Allow public inserts for the contact form
CREATE POLICY "Public can create leads" ON leads FOR INSERT WITH CHECK (true);

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SHOWINGS
-- ============================================================
CREATE TABLE showings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE showings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listing owners can manage showings" ON showings
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM listings WHERE id = listing_id)
  );

-- ============================================================
-- OFFERS
-- ============================================================
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'countered', 'accepted', 'rejected')),
  conditions TEXT,
  ai_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listing owners can manage offers" ON offers
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM listings WHERE id = listing_id)
  );

CREATE TRIGGER offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- CALCULATOR LEADS
-- ============================================================
CREATE TABLE calculator_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  home_value NUMERIC NOT NULL,
  city TEXT NOT NULL,
  traditional_commission NUMERIC NOT NULL,
  savings_estimate NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE calculator_leads ENABLE ROW LEVEL SECURITY;
-- Only service role can read; public can insert
CREATE POLICY "Public can create calculator leads" ON calculator_leads FOR INSERT WITH CHECK (true);

-- ============================================================
-- INTERESTED SELLERS
-- ============================================================
CREATE TABLE interested_sellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address_or_zip TEXT NOT NULL,
  home_value_range TEXT,
  timeline TEXT,
  source TEXT DEFAULT 'landing_page',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE interested_sellers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage interested sellers" ON interested_sellers FOR ALL USING (true);
CREATE POLICY "Public can create interested sellers" ON interested_sellers FOR INSERT WITH CHECK (true);

-- ============================================================
-- CONTENT PIECES (Blog)
-- ============================================================
CREATE TABLE content_pieces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  topic TEXT NOT NULL,
  content TEXT,
  reading_time_minutes INTEGER DEFAULT 5,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE content_pieces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published content" ON content_pieces FOR SELECT USING (status = 'published');
CREATE POLICY "Service role can manage content" ON content_pieces FOR ALL USING (true);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Increment views_count safely
CREATE OR REPLACE FUNCTION increment_views_count(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE listings SET views_count = views_count + 1 WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment leads_count safely
CREATE OR REPLACE FUNCTION increment_leads_count(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE listings SET leads_count = leads_count + 1 WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STORAGE BUCKETS
-- Run these in the Supabase SQL editor or Dashboard > Storage
-- ============================================================

-- Public buckets (accessible without auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('listing-photos', 'listing-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('listing-videos', 'listing-videos', true, 104857600, ARRAY['video/mp4', 'video/quicktime', 'video/webm']),
  ('ad-creatives', 'ad-creatives', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Private bucket (requires auth to read)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('documents', 'documents', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies

-- listing-photos: authenticated users can upload to their own folder
CREATE POLICY "Users can upload listing photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-photos');

CREATE POLICY "Anyone can view listing photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-photos');

CREATE POLICY "Users can delete own listing photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- listing-videos
CREATE POLICY "Users can upload listing videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-videos');

CREATE POLICY "Anyone can view listing videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-videos');

-- ad-creatives
CREATE POLICY "Users can manage ad creatives" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'ad-creatives')
  WITH CHECK (bucket_id = 'ad-creatives');

CREATE POLICY "Anyone can view ad creatives" ON storage.objects
  FOR SELECT USING (bucket_id = 'ad-creatives');

-- documents: private, only owner can access
CREATE POLICY "Users can manage own documents" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
