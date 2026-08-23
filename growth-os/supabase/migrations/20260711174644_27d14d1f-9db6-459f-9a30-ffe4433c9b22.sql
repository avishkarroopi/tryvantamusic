
-- Agents Workforce module tables
CREATE TABLE public.agents_registry (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'Bot',
  default_schedule TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  mode TEXT NOT NULL DEFAULT 'manual' CHECK (mode IN ('manual','scheduled','disabled')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INT NOT NULL DEFAULT 1,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents_registry TO authenticated;
GRANT ALL ON public.agents_registry TO service_role;
ALTER TABLE public.agents_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team read agents_registry" ON public.agents_registry FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "team write agents_registry" ON public.agents_registry FOR ALL TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE TRIGGER trg_agents_registry_updated BEFORE UPDATE ON public.agents_registry FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.agents_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_slug TEXT NOT NULL REFERENCES public.agents_registry(slug) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','succeeded','failed')),
  trigger TEXT NOT NULL DEFAULT 'manual' CHECK (trigger IN ('manual','scheduled','ceo')),
  attempt INT NOT NULL DEFAULT 1,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB,
  error TEXT,
  duration_ms INT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_agents_runs_slug_started ON public.agents_runs(agent_slug, started_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents_runs TO authenticated;
GRANT ALL ON public.agents_runs TO service_role;
ALTER TABLE public.agents_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team all agents_runs" ON public.agents_runs FOR ALL TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));

CREATE TABLE public.agents_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_slug TEXT NOT NULL REFERENCES public.agents_registry(slug) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'work',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','done','failed')),
  scheduled_for TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_agents_tasks_slug_status ON public.agents_tasks(agent_slug, status, scheduled_for);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents_tasks TO authenticated;
GRANT ALL ON public.agents_tasks TO service_role;
ALTER TABLE public.agents_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team all agents_tasks" ON public.agents_tasks FOR ALL TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE TRIGGER trg_agents_tasks_updated BEFORE UPDATE ON public.agents_tasks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.agents_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES public.agents_runs(id) ON DELETE CASCADE,
  agent_slug TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info','warn','error')),
  message TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_agents_logs_run ON public.agents_logs(run_id, created_at);
CREATE INDEX idx_agents_logs_slug ON public.agents_logs(agent_slug, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents_logs TO authenticated;
GRANT ALL ON public.agents_logs TO service_role;
ALTER TABLE public.agents_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team all agents_logs" ON public.agents_logs FOR ALL TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));

CREATE TABLE public.agents_metrics (
  agent_slug TEXT NOT NULL REFERENCES public.agents_registry(slug) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  runs INT NOT NULL DEFAULT 0,
  successes INT NOT NULL DEFAULT 0,
  failures INT NOT NULL DEFAULT 0,
  avg_duration_ms INT NOT NULL DEFAULT 0,
  health_score INT NOT NULL DEFAULT 100,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (agent_slug, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents_metrics TO authenticated;
GRANT ALL ON public.agents_metrics TO service_role;
ALTER TABLE public.agents_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team all agents_metrics" ON public.agents_metrics FOR ALL TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));

CREATE TABLE public.agents_memory (
  agent_slug TEXT NOT NULL REFERENCES public.agents_registry(slug) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (agent_slug, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents_memory TO authenticated;
GRANT ALL ON public.agents_memory TO service_role;
ALTER TABLE public.agents_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team all agents_memory" ON public.agents_memory FOR ALL TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));

CREATE TABLE public.agents_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary TEXT NOT NULL,
  priorities JSONB NOT NULL DEFAULT '[]'::jsonb,
  bottlenecks JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  workforce_health INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents_briefs TO authenticated;
GRANT ALL ON public.agents_briefs TO service_role;
ALTER TABLE public.agents_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team all agents_briefs" ON public.agents_briefs FOR ALL TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));

-- Seed the AI workforce
INSERT INTO public.agents_registry (slug, name, category, description, icon, mode) VALUES
  ('ceo','CEO Agent','executive','Monitors the AI workforce, generates executive summaries, prioritizes work and detects bottlenecks.','Crown','manual'),
  ('marketing','Marketing Agent','growth','Plans campaigns, monitors channel performance, and recommends budget shifts.','Megaphone','manual'),
  ('sales','Sales Agent','growth','Prioritizes hot leads, drafts outreach, and coordinates follow-ups.','Handshake','manual'),
  ('content','Content Agent','growth','Drafts posts, emails, and campaign copy across channels.','PenLine','manual'),
  ('seo','SEO Agent','growth','Improves organic visibility, tracks rankings, and optimises Google Business Profile.','Search','manual'),
  ('customer_success','Customer Success Agent','operations','Nurtures enrolled students and monitors satisfaction signals.','HeartHandshake','manual'),
  ('operations','Operations Agent','operations','Watches system health, task backlogs, and workflow bottlenecks.','Settings2','manual'),
  ('analytics','Analytics Agent','intelligence','Compiles cross-functional dashboards and trend analysis.','BarChart3','manual'),
  ('finance','Finance Agent','intelligence','Tracks revenue, CAC, LTV and cash health.','IndianRupee','manual'),
  ('automation','Automation Agent','operations','Builds and maintains internal automations and integrations.','Zap','manual'),
  ('research','Research Agent','intelligence','Monitors competitors, market trends, and opportunities.','Telescope','manual')
ON CONFLICT (slug) DO NOTHING;
