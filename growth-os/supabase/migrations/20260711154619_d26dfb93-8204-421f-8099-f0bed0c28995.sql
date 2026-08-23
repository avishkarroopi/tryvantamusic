
-- ============ gbp_profile ============
CREATE TABLE public.gbp_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  primary_category TEXT,
  additional_categories TEXT[] DEFAULT '{}',
  phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  opening_hours JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  keywords TEXT[] DEFAULT '{}',
  cover_image_url TEXT,
  logo_url TEXT,
  photo_count INT DEFAULT 0,
  video_count INT DEFAULT 0,
  post_count INT DEFAULT 0,
  qna_count INT DEFAULT 0,
  services JSONB DEFAULT '[]'::jsonb,
  products JSONB DEFAULT '[]'::jsonb,
  appointment_link TEXT,
  total_reviews INT DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  health_score INT DEFAULT 0,
  visibility_score INT DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gbp_profile TO authenticated;
GRANT ALL ON public.gbp_profile TO service_role;
ALTER TABLE public.gbp_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gbp_profile owner" ON public.gbp_profile FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER gbp_profile_touch BEFORE UPDATE ON public.gbp_profile
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ gbp_reviews ============
CREATE TABLE public.gbp_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id TEXT,
  reviewer_name TEXT,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  reply_text TEXT,
  replied BOOLEAN NOT NULL DEFAULT false,
  sentiment TEXT,
  keywords TEXT[] DEFAULT '{}',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gbp_reviews TO authenticated;
GRANT ALL ON public.gbp_reviews TO service_role;
ALTER TABLE public.gbp_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gbp_reviews owner" ON public.gbp_reviews FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER gbp_reviews_touch BEFORE UPDATE ON public.gbp_reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX gbp_reviews_user_idx ON public.gbp_reviews(user_id, reviewed_at DESC);

-- ============ gbp_posts ============
CREATE TABLE public.gbp_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL DEFAULT 'update',
  title TEXT,
  body TEXT,
  image_url TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gbp_posts TO authenticated;
GRANT ALL ON public.gbp_posts TO service_role;
ALTER TABLE public.gbp_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gbp_posts owner" ON public.gbp_posts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER gbp_posts_touch BEFORE UPDATE ON public.gbp_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ gbp_competitors ============
CREATE TABLE public.gbp_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  review_count INT DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  categories TEXT[] DEFAULT '{}',
  photo_count INT DEFAULT 0,
  post_count INT DEFAULT 0,
  services JSONB DEFAULT '[]'::jsonb,
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  visibility_score INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gbp_competitors TO authenticated;
GRANT ALL ON public.gbp_competitors TO service_role;
ALTER TABLE public.gbp_competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gbp_competitors owner" ON public.gbp_competitors FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER gbp_competitors_touch BEFORE UPDATE ON public.gbp_competitors
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ gbp_actions ============
CREATE TABLE public.gbp_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  expected_impact TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gbp_actions TO authenticated;
GRANT ALL ON public.gbp_actions TO service_role;
ALTER TABLE public.gbp_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gbp_actions owner" ON public.gbp_actions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER gbp_actions_touch BEFORE UPDATE ON public.gbp_actions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ gbp_reputation_snapshots ============
CREATE TABLE public.gbp_reputation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_reviews INT DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  photo_count INT DEFAULT 0,
  post_count INT DEFAULT 0,
  visibility_score INT DEFAULT 0,
  health_score INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gbp_reputation_snapshots TO authenticated;
GRANT ALL ON public.gbp_reputation_snapshots TO service_role;
ALTER TABLE public.gbp_reputation_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gbp_snapshots owner" ON public.gbp_reputation_snapshots FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX gbp_snapshots_user_date_idx ON public.gbp_reputation_snapshots(user_id, snapshot_date DESC);
