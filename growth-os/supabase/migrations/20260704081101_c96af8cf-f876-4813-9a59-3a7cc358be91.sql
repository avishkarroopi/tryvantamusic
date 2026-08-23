
-- ENUMS
CREATE TYPE public.ad_platform AS ENUM ('meta','google');
CREATE TYPE public.ad_entity_level AS ENUM ('campaign','adset','ad','keyword','ad_group');
CREATE TYPE public.ad_reco_status AS ENUM ('pending','approved','dismissed','applied');
CREATE TYPE public.ad_reco_priority AS ENUM ('low','normal','high','critical');
CREATE TYPE public.content_kind AS ENUM ('post','reel','story','blog','email','template','video','carousel');
CREATE TYPE public.content_status AS ENUM ('idea','draft','approved','scheduled','published','archived');
CREATE TYPE public.brief_period AS ENUM ('daily','weekly','monthly');
CREATE TYPE public.insight_priority AS ENUM ('low','normal','high','critical');
CREATE TYPE public.copilot_role AS ENUM ('user','assistant','system');

-- ENROLLMENTS (revenue tracking)
CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  program text,
  instrument text,
  country text,
  source public.lead_source,
  campaign text,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team manages enrollments" ON public.enrollments FOR ALL TO authenticated
  USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE INDEX idx_enrollments_lead ON public.enrollments(lead_id);
CREATE INDEX idx_enrollments_enrolled_at ON public.enrollments(enrolled_at DESC);
CREATE INDEX idx_enrollments_source ON public.enrollments(source);
CREATE TRIGGER enrollments_touch BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- MARKETING COSTS
CREATE TABLE public.marketing_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source public.lead_source,
  campaign text,
  cost numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  period_start date NOT NULL,
  period_end date NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_costs TO authenticated;
GRANT ALL ON public.marketing_costs TO service_role;
ALTER TABLE public.marketing_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team manages marketing_costs" ON public.marketing_costs FOR ALL TO authenticated
  USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE INDEX idx_marketing_costs_period ON public.marketing_costs(period_start DESC);
CREATE TRIGGER marketing_costs_touch BEFORE UPDATE ON public.marketing_costs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- AD ENTITIES (meta & google unified)
CREATE TABLE public.ad_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform public.ad_platform NOT NULL,
  level public.ad_entity_level NOT NULL,
  external_id text,
  parent_external_id text,
  name text NOT NULL,
  status text,
  budget numeric(12,2),
  currency text DEFAULT 'INR',
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  period_start date,
  period_end date,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_entities TO authenticated;
GRANT ALL ON public.ad_entities TO service_role;
ALTER TABLE public.ad_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team manages ad_entities" ON public.ad_entities FOR ALL TO authenticated
  USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE INDEX idx_ad_entities_platform_level ON public.ad_entities(platform, level);
CREATE INDEX idx_ad_entities_parent ON public.ad_entities(parent_external_id);
CREATE TRIGGER ad_entities_touch BEFORE UPDATE ON public.ad_entities
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- AD RECOMMENDATIONS (human approval required)
CREATE TABLE public.ad_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform public.ad_platform NOT NULL,
  entity_ref text,
  entity_name text,
  kind text NOT NULL,
  title text NOT NULL,
  rationale text,
  priority public.ad_reco_priority NOT NULL DEFAULT 'normal',
  status public.ad_reco_status NOT NULL DEFAULT 'pending',
  metrics_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  approved_by uuid,
  approved_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_recommendations TO authenticated;
GRANT ALL ON public.ad_recommendations TO service_role;
ALTER TABLE public.ad_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team manages ad_recommendations" ON public.ad_recommendations FOR ALL TO authenticated
  USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE INDEX idx_ad_recos_status ON public.ad_recommendations(status, priority);
CREATE INDEX idx_ad_recos_platform ON public.ad_recommendations(platform);
CREATE TRIGGER ad_recos_touch BEFORE UPDATE ON public.ad_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- CONTENT ITEMS
CREATE TABLE public.content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.content_kind NOT NULL DEFAULT 'post',
  title text NOT NULL,
  body text,
  category text,
  status public.content_status NOT NULL DEFAULT 'idea',
  platform text,
  scheduled_for timestamptz,
  published_at timestamptz,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_generated boolean NOT NULL DEFAULT false,
  ai_prompt text,
  approved_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_items TO authenticated;
GRANT ALL ON public.content_items TO service_role;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team manages content_items" ON public.content_items FOR ALL TO authenticated
  USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE INDEX idx_content_status ON public.content_items(status);
CREATE INDEX idx_content_scheduled ON public.content_items(scheduled_for);
CREATE INDEX idx_content_kind ON public.content_items(kind);
CREATE TRIGGER content_items_touch BEFORE UPDATE ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- FOUNDER BRIEFS
CREATE TABLE public.founder_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period public.brief_period NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  summary text NOT NULL,
  highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.founder_briefs TO authenticated;
GRANT ALL ON public.founder_briefs TO service_role;
ALTER TABLE public.founder_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team manages founder_briefs" ON public.founder_briefs FOR ALL TO authenticated
  USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE INDEX idx_briefs_period ON public.founder_briefs(period, period_start DESC);

-- INSIGHTS (unified insight engine)
CREATE TABLE public.insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent text NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  priority public.insight_priority NOT NULL DEFAULT 'normal',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insights TO authenticated;
GRANT ALL ON public.insights TO service_role;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team manages insights" ON public.insights FOR ALL TO authenticated
  USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE INDEX idx_insights_agent_created ON public.insights(agent, created_at DESC);
CREATE INDEX idx_insights_active ON public.insights(dismissed_at, priority);

-- COPILOT MESSAGES (per-user chat history — one conversation per user)
CREATE TABLE public.copilot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.copilot_role NOT NULL,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.copilot_messages TO authenticated;
GRANT ALL ON public.copilot_messages TO service_role;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own copilot messages" ON public.copilot_messages FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_copilot_user_created ON public.copilot_messages(user_id, created_at);

-- Add review_source column for V6 tracking
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS reviewer_name text,
  ADD COLUMN IF NOT EXISTS review_url text,
  ADD COLUMN IF NOT EXISTS request_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_received_at timestamptz;
