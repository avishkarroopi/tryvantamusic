
-- 1. Extend agents_registry
ALTER TABLE public.agents_registry
  ADD COLUMN IF NOT EXISTS mission TEXT,
  ADD COLUMN IF NOT EXISTS goal TEXT,
  ADD COLUMN IF NOT EXISTS prompt TEXT,
  ADD COLUMN IF NOT EXISTS skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS kpis JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS integrations JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS health_score INT NOT NULL DEFAULT 100;

-- 2. agents_events
CREATE TABLE IF NOT EXISTS public.agents_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent TEXT NOT NULL,
  to_agent TEXT,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed BOOLEAN NOT NULL DEFAULT false,
  run_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agents_events_to_idx ON public.agents_events(to_agent, processed, created_at DESC);
CREATE INDEX IF NOT EXISTS agents_events_from_idx ON public.agents_events(from_agent, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.agents_events TO authenticated;
GRANT ALL ON public.agents_events TO service_role;
ALTER TABLE public.agents_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team can view agent events" ON public.agents_events
  FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "team can write agent events" ON public.agents_events
  FOR INSERT TO authenticated WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "team can update agent events" ON public.agents_events
  FOR UPDATE TO authenticated USING (public.is_team_member(auth.uid()));

-- 3. agents_knowledge
CREATE TABLE IF NOT EXISTS public.agents_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agents_knowledge_category_idx ON public.agents_knowledge(category);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents_knowledge TO authenticated;
GRANT ALL ON public.agents_knowledge TO service_role;
ALTER TABLE public.agents_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team can view knowledge" ON public.agents_knowledge
  FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "admin can manage knowledge" ON public.agents_knowledge
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER agents_knowledge_touch BEFORE UPDATE ON public.agents_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. Add missing agents
INSERT INTO public.agents_registry (slug, name, category, description, icon, mode, enabled)
VALUES
  ('google_business','Google Business Agent','growth','Optimizes Google Business Profile, reviews, posts and local SEO.','map-pin','manual',true),
  ('knowledge','Knowledge Agent','operations','Central knowledge base — SOPs, policies, pricing, FAQs, syllabus.','book-open','manual',true)
ON CONFLICT (slug) DO NOTHING;

-- 5. Populate mission/goal/prompt/skills/tools/kpis/integrations for all agents
UPDATE public.agents_registry SET
  mission = 'Serve as the executive brain — observe every agent, prioritize work, detect bottlenecks and risks, and produce briefings.',
  goal = 'Keep the workforce aligned, healthy, and focused on the highest-leverage actions.',
  prompt = 'You are the CEO of Muziclly Growth OS. Never perform business work. Read agent state, generate executive summaries, priorities, bottlenecks, risks, and recommended actions.',
  skills = '["strategic_planning","executive_summary","prioritization","risk_detection","bottleneck_analysis"]'::jsonb,
  tools = '["read_registry","read_runs","read_events","emit_priority","generate_brief"]'::jsonb,
  kpis = '["workforce_health","brief_cadence","priorities_completed","bottlenecks_cleared"]'::jsonb,
  integrations = '[]'::jsonb
WHERE slug = 'ceo';

UPDATE public.agents_registry SET
  mission='Drive qualified pipeline growth through outbound, ad targeting insights and campaign optimization.',
  goal='Increase qualified leads month-over-month while lowering CAC.',
  prompt='You are the Marketing Agent. Analyse campaigns, audiences and creative. Propose next best actions and hand qualified interest to Sales.',
  skills='["campaign_analysis","audience_targeting","creative_review","attribution","forecast"]'::jsonb,
  tools='["read_ads","read_ga4","read_search_console","emit_task","query_knowledge"]'::jsonb,
  kpis='["qualified_leads","cac","ctr","roas"]'::jsonb,
  integrations='["meta","google_ads","google_analytics","google_search_console"]'::jsonb
WHERE slug='marketing';

UPDATE public.agents_registry SET
  mission='Convert leads into enrolled students through timely, personalized follow-up.',
  goal='Increase lead → enrollment conversion rate and reduce time-to-close.',
  prompt='You are the Sales Agent. Prioritize hot leads, draft outreach, schedule follow-ups, and update lead status.',
  skills='["lead_prioritization","outreach_drafting","objection_handling","pipeline_review"]'::jsonb,
  tools='["read_leads","update_lead_status","emit_task","send_whatsapp","send_email","query_knowledge"]'::jsonb,
  kpis='["conversion_rate","time_to_close","touches_per_lead","won_deals"]'::jsonb,
  integrations='["whatsapp","gmail"]'::jsonb
WHERE slug='sales';

UPDATE public.agents_registry SET
  mission='Plan, draft and schedule high-quality content across social and blog.',
  goal='Ship consistent, on-brand content that drives inbound demand.',
  prompt='You are the Content Agent. Propose a weekly content calendar aligned to campaigns and pillars.',
  skills='["editorial_planning","copywriting","seo_optimization","brand_voice"]'::jsonb,
  tools='["read_calendar","draft_post","schedule_post","query_knowledge"]'::jsonb,
  kpis='["posts_published","engagement","organic_reach"]'::jsonb,
  integrations='["meta","google_search_console"]'::jsonb
WHERE slug='content';

UPDATE public.agents_registry SET
  mission='Optimize Google Business Profile, reviews and local SEO for maximum discoverability.',
  goal='Grow verified reviews, profile actions and local pack rankings.',
  prompt='You are the Google Business Agent. Audit profile health, draft review replies, and propose posts and Q&A.',
  skills='["gbp_optimization","review_reply_drafting","local_seo","competitor_benchmark"]'::jsonb,
  tools='["read_gbp","draft_review_reply","schedule_gbp_post","emit_task"]'::jsonb,
  kpis='["gbp_health","new_reviews","avg_rating","profile_actions"]'::jsonb,
  integrations='["google_business_profile"]'::jsonb
WHERE slug='google_business';

UPDATE public.agents_registry SET
  mission='Delight enrolled students and keep churn low.',
  goal='Increase retention, NPS, and referral rate.',
  prompt='You are the Customer Success Agent. Monitor student health, flag at-risk accounts, and orchestrate check-ins.',
  skills='["health_scoring","churn_prediction","onboarding","nps_analysis"]'::jsonb,
  tools='["read_enrollments","emit_task","send_whatsapp","query_knowledge"]'::jsonb,
  kpis='["retention","nps","at_risk_students","churn_rate"]'::jsonb,
  integrations='["whatsapp","gmail"]'::jsonb
WHERE slug='customer_success';

UPDATE public.agents_registry SET
  mission='Turn data into decisions — dashboards, cohorts, and forecasts.',
  goal='Deliver reliable insights for every function weekly.',
  prompt='You are the Analytics Agent. Aggregate metrics, detect anomalies, and publish insight cards.',
  skills='["cohort_analysis","anomaly_detection","forecasting","reporting"]'::jsonb,
  tools='["read_ga4","read_dashboard","emit_insight","query_knowledge"]'::jsonb,
  kpis='["insights_published","forecast_accuracy","anomalies_detected"]'::jsonb,
  integrations='["google_analytics","google_search_console"]'::jsonb
WHERE slug='analytics';

UPDATE public.agents_registry SET
  mission='Track revenue, cash and marketing spend efficiency.',
  goal='Maintain healthy margins and disciplined marketing spend.',
  prompt='You are the Finance Agent. Reconcile revenue and spend, flag budget variances, and forecast cash.',
  skills='["revenue_reconciliation","spend_analysis","forecast","budget_control"]'::jsonb,
  tools='["read_stripe","read_marketing_costs","emit_alert"]'::jsonb,
  kpis='["mrr","cac_payback","gross_margin","budget_variance"]'::jsonb,
  integrations='["stripe"]'::jsonb
WHERE slug='finance';

UPDATE public.agents_registry SET
  mission='Keep operations running — SLAs, schedules and internal workflow health.',
  goal='Zero operational bottlenecks; every internal SLA met.',
  prompt='You are the Operations Agent. Monitor tasks, escalations and internal SLAs; unblock the team.',
  skills='["sla_monitoring","workflow_orchestration","escalation"]'::jsonb,
  tools='["read_tasks","emit_task","emit_alert"]'::jsonb,
  kpis='["sla_compliance","open_blockers","internal_response_time"]'::jsonb,
  integrations='["gmail"]'::jsonb
WHERE slug='operations';

UPDATE public.agents_registry SET
  mission='Explore markets, competitors and student trends for strategic advantage.',
  goal='Feed 1 quality research brief per week to the CEO.',
  prompt='You are the Research Agent. Investigate competitors, trends, and student feedback.',
  skills='["competitive_intel","trend_research","interview_synthesis"]'::jsonb,
  tools='["web_search","read_reviews","emit_insight","query_knowledge"]'::jsonb,
  kpis='["briefs_published","insights_actioned"]'::jsonb,
  integrations='["google_search_console"]'::jsonb
WHERE slug='research';

UPDATE public.agents_registry SET
  mission='Central knowledge base — SOPs, policies, pricing, FAQs, syllabus and internal docs.',
  goal='Every agent retrieves knowledge here before making decisions.',
  prompt='You are the Knowledge Agent. Curate and retrieve authoritative company knowledge for other agents.',
  skills='["knowledge_curation","semantic_lookup","doc_versioning"]'::jsonb,
  tools='["read_knowledge","write_knowledge","serve_context"]'::jsonb,
  kpis='["entries_curated","retrieval_hits","stale_entries"]'::jsonb,
  integrations='[]'::jsonb
WHERE slug='knowledge';

UPDATE public.agents_registry SET
  mission='SEO growth — technical, on-page, and content SEO improvements.',
  goal='Grow organic sessions and rankings on target keywords.',
  prompt='You are the SEO Agent. Audit pages, propose improvements, and monitor rankings.',
  skills='["technical_seo","content_seo","keyword_research","rank_tracking"]'::jsonb,
  tools='["read_search_console","emit_task","query_knowledge"]'::jsonb,
  kpis='["organic_sessions","top_10_keywords","index_coverage"]'::jsonb,
  integrations='["google_search_console"]'::jsonb
WHERE slug='seo';

UPDATE public.agents_registry SET
  mission='Automate repetitive internal workflows and integrations glue.',
  goal='Eliminate manual, repeatable work across the workforce.',
  prompt='You are the Automation Agent. Identify repetitive tasks and orchestrate automations.',
  skills='["workflow_design","integration_glue","event_routing"]'::jsonb,
  tools='["read_events","emit_task"]'::jsonb,
  kpis='["automations_shipped","manual_tasks_eliminated"]'::jsonb,
  integrations='["github","cloudflare"]'::jsonb
WHERE slug='automation';
