
-- Competitive Intelligence — additive extension of the existing GBP module.
-- No existing table/policy/trigger is altered in a breaking way; this only
-- adds columns and two new tables, following the exact conventions already
-- used by gbp_* (owner-scoped RLS, GRANTs, touch_updated_at trigger, indexes).

-- ============ Brand Intelligence: extend gbp_reputation_snapshots ============
-- (Reused rather than duplicated — this table already captures the right
-- shape of periodic brand-health data; we're adding the 3 new signals.)
ALTER TABLE public.gbp_reputation_snapshots
  ADD COLUMN IF NOT EXISTS sentiment_score INT,
  ADD COLUMN IF NOT EXISTS review_velocity NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS response_rate NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS consistency_score INT;

-- ============ gbp_competitor_candidates ============
-- Discovery queue: never auto-inserted into gbp_competitors, always
-- reviewed via approve/reject.
CREATE TABLE public.gbp_competitor_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  place_id TEXT,
  address TEXT,
  url TEXT,
  rating NUMERIC(3,2),
  review_count INT DEFAULT 0,
  categories TEXT[] DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'google_places',
  confidence NUMERIC(3,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  raw JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE (user_id, place_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gbp_competitor_candidates TO authenticated;
GRANT ALL ON public.gbp_competitor_candidates TO service_role;
ALTER TABLE public.gbp_competitor_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gbp_competitor_candidates owner" ON public.gbp_competitor_candidates FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX gbp_competitor_candidates_user_status_idx
  ON public.gbp_competitor_candidates(user_id, status);

-- ============ gbp_competitor_ads ============
-- Per-competitor ad activity (Meta Ad Library today; Google Ads Transparency
-- Center documented as a future `platform` value, not half-implemented here).
CREATE TABLE public.gbp_competitor_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES public.gbp_competitors(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'meta',
  ad_archive_id TEXT,
  ad_creative_url TEXT,
  ad_copy TEXT,
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  raw JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, ad_archive_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gbp_competitor_ads TO authenticated;
GRANT ALL ON public.gbp_competitor_ads TO service_role;
ALTER TABLE public.gbp_competitor_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gbp_competitor_ads owner" ON public.gbp_competitor_ads FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER gbp_competitor_ads_touch BEFORE UPDATE ON public.gbp_competitor_ads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX gbp_competitor_ads_competitor_idx
  ON public.gbp_competitor_ads(competitor_id, is_active);
