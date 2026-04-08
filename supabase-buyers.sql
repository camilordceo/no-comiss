-- ============================================================
-- NoComiss – Buyers, Negotiations, Calendar, Notifications
-- Run AFTER supabase-schema.sql and supabase-additions.sql
-- ============================================================

-- ============================================================
-- BUYER PROFILES
-- A buyer can also be a seller — same auth.users account.
-- ============================================================
CREATE TABLE buyer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,   -- null = guest
  -- Guest fields (filled even without account)
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  -- Preferences
  budget_min BIGINT,
  budget_max BIGINT,
  preferred_cities TEXT[] DEFAULT '{}',
  preferred_types TEXT[] DEFAULT '{}',        -- apartment, house, etc.
  min_bedrooms INTEGER,
  min_area_m2 INTEGER,
  preferred_neighborhoods TEXT[] DEFAULT '{}',
  -- Financing
  financing_type TEXT CHECK (financing_type IN ('cash', 'mortgage', 'leasing', 'undecided')),
  pre_approved BOOLEAN DEFAULT FALSE,
  -- Timeline
  buying_timeline TEXT CHECK (buying_timeline IN ('immediate', '1_3_months', '3_6_months', '6_plus_months')),
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  notes TEXT,
  source TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX buyer_profiles_user_id_idx ON buyer_profiles(user_id);
CREATE INDEX buyer_profiles_email_idx ON buyer_profiles(email);

ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own buyer profile" ON buyer_profiles
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can create buyer profile" ON buyer_profiles
  FOR INSERT WITH CHECK (true);
-- Listing owners can see buyers who contacted them (via leads)
CREATE POLICY "Service role can manage buyer profiles" ON buyer_profiles
  FOR ALL USING (true);

CREATE TRIGGER buyer_profiles_updated_at
  BEFORE UPDATE ON buyer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- NEGOTIATIONS
-- Tracks the full lifecycle of a deal between buyer & seller
-- ============================================================
CREATE TABLE negotiations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,        -- null if guest
  buyer_profile_id UUID REFERENCES buyer_profiles(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  -- State machine
  status TEXT NOT NULL DEFAULT 'inquiry'
    CHECK (status IN (
      'inquiry',          -- buyer showed interest
      'showing_scheduled',-- visit booked
      'showing_done',     -- visit completed
      'offer_made',       -- buyer sent offer
      'countered',        -- seller countered
      'accepted',         -- offer accepted
      'due_diligence',    -- inspections, docs
      'closed_won',       -- deal done
      'closed_lost'       -- fell through
    )),
  -- Offer amounts (history tracked in negotiation_events)
  initial_offer BIGINT,
  final_price BIGINT,
  -- Key dates
  offer_date TIMESTAMPTZ,
  accepted_date TIMESTAMPTZ,
  closing_date TIMESTAMPTZ,
  -- Notes & attachments
  seller_notes TEXT,
  buyer_notes TEXT,
  ai_analysis JSONB,     -- AI summary of deal health
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX negotiations_listing_id_idx ON negotiations(listing_id);
CREATE INDEX negotiations_seller_id_idx ON negotiations(seller_id);
CREATE INDEX negotiations_buyer_id_idx ON negotiations(buyer_id);

ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sellers manage own negotiations" ON negotiations
  FOR ALL USING (auth.uid() = seller_id);
CREATE POLICY "Buyers view their negotiations" ON negotiations
  FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Service role full access negotiations" ON negotiations
  FOR ALL USING (true);

CREATE TRIGGER negotiations_updated_at
  BEFORE UPDATE ON negotiations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- NEGOTIATION EVENTS (audit trail / timeline)
-- ============================================================
CREATE TABLE negotiation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negotiation_id UUID NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role TEXT CHECK (actor_role IN ('seller', 'buyer', 'system')),
  event_type TEXT NOT NULL,   -- 'status_change', 'offer', 'message', 'document', 'note'
  old_status TEXT,
  new_status TEXT,
  amount BIGINT,              -- for offer events
  message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX negotiation_events_negotiation_id_idx ON negotiation_events(negotiation_id);

ALTER TABLE negotiation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties can view negotiation events" ON negotiation_events
  FOR SELECT USING (
    auth.uid() = (SELECT seller_id FROM negotiations WHERE id = negotiation_id)
    OR auth.uid() = (SELECT buyer_id FROM negotiations WHERE id = negotiation_id)
  );
CREATE POLICY "Service role full access events" ON negotiation_events FOR ALL USING (true);

-- ============================================================
-- CALENDAR CONNECTIONS
-- Stores OAuth tokens for Google Calendar per user
-- ============================================================
CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google' CHECK (provider IN ('google', 'calendly')),
  -- Google Calendar
  google_access_token TEXT,
  google_refresh_token TEXT,         -- encrypted at rest ideally
  google_token_expiry TIMESTAMPTZ,
  google_calendar_id TEXT DEFAULT 'primary',
  google_email TEXT,
  -- Calendly
  calendly_api_key TEXT,
  calendly_scheduling_url TEXT,      -- e.g. https://calendly.com/username
  calendly_user_uri TEXT,
  -- Status
  connected BOOLEAN NOT NULL DEFAULT TRUE,
  scopes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, provider)
);

ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own calendar connections" ON calendar_connections
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER calendar_connections_updated_at
  BEFORE UPDATE ON calendar_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  -- Channels
  email_enabled BOOLEAN DEFAULT TRUE,
  whatsapp_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  -- Event subscriptions
  new_lead BOOLEAN DEFAULT TRUE,
  showing_scheduled BOOLEAN DEFAULT TRUE,
  showing_reminder BOOLEAN DEFAULT TRUE,   -- 24h before showing
  offer_received BOOLEAN DEFAULT TRUE,
  negotiation_update BOOLEAN DEFAULT TRUE,
  payment_confirmed BOOLEAN DEFAULT TRUE,
  weekly_summary BOOLEAN DEFAULT TRUE,
  -- Contact overrides (if different from profile)
  notify_email TEXT,
  notify_phone TEXT,
  notify_whatsapp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notification prefs" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create notification preferences on profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE v_provider TEXT;
BEGIN
  v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  INSERT INTO profiles (id, email, full_name, avatar_url, provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    v_provider
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    provider = EXCLUDED.provider,
    updated_at = NOW();

  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SHOWINGS (enhanced — replaces the basic showings table)
-- Drop old and recreate with full fields
-- ============================================================
DROP TABLE IF EXISTS showings CASCADE;

CREATE TABLE showings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  buyer_profile_id UUID REFERENCES buyer_profiles(id) ON DELETE SET NULL,
  negotiation_id UUID REFERENCES negotiations(id) ON DELETE SET NULL,
  -- Buyer info (denormalized for quick access)
  buyer_name TEXT NOT NULL,
  buyer_email TEXT,
  buyer_phone TEXT,
  -- Schedule
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  -- Calendar integration
  google_event_id TEXT,          -- Google Calendar event ID
  google_meet_link TEXT,         -- Google Meet link if virtual
  calendly_event_uri TEXT,       -- Calendly event URI
  calendly_invitee_uri TEXT,
  -- Notes
  seller_notes TEXT,
  buyer_notes TEXT,
  feedback TEXT,                 -- post-showing feedback
  -- Notifications
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX showings_listing_id_idx ON showings(listing_id);
CREATE INDEX showings_seller_id_idx ON showings(seller_id);
CREATE INDEX showings_scheduled_at_idx ON showings(scheduled_at);

ALTER TABLE showings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sellers manage their showings" ON showings
  FOR ALL USING (auth.uid() = seller_id);
CREATE POLICY "Public can create showings" ON showings
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role full access showings" ON showings
  FOR ALL USING (true);

CREATE TRIGGER showings_updated_at
  BEFORE UPDATE ON showings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PROFILES: add user_role column
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'seller'
    CHECK (user_role IN ('seller', 'buyer', 'both'));
