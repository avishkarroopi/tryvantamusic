
-- =========================================================================
-- ENUMS
-- =========================================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'sales', 'marketing', 'viewer');

CREATE TYPE public.lead_status AS ENUM (
  'new', 'contacted', 'qualified', 'assessment_scheduled',
  'assessment_completed', 'enrollment_pending', 'enrolled',
  'lost', 'dormant', 're_engagement'
);

CREATE TYPE public.lead_label AS ENUM (
  'hot', 'warm', 'cold', 'high_value', 'nri', 'parent',
  'adult_learner', 'certification', 'professional'
);

CREATE TYPE public.lead_source AS ENUM (
  'website', 'facebook_ads', 'instagram_ads', 'whatsapp',
  'google_ads', 'organic', 'referral', 'manual', 'other'
);

CREATE TYPE public.skill_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.learning_goal AS ENUM ('hobby', 'certification', 'professional', 'teacher_training');
CREATE TYPE public.urgency_level AS ENUM ('low', 'medium', 'high', 'immediate');
CREATE TYPE public.budget_level AS ENUM ('low', 'medium', 'high', 'premium');

CREATE TYPE public.task_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'done', 'cancelled');

CREATE TYPE public.reengagement_type AS ENUM (
  'soft_reminder', 'limited_offer', 'new_program',
  'success_story', 'certification_reminder', 'personalized'
);

CREATE TYPE public.notification_type AS ENUM (
  'new_lead', 'hot_lead', 'dormant_lead', 'recovered_lead',
  'assessment_scheduled', 'followup_required', 'system'
);

-- =========================================================================
-- PROFILES (team members)
-- =========================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- USER ROLES (separate table, per security best practice)
-- =========================================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

-- =========================================================================
-- Handle new user: create profile + auto-grant admin to first user
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Policies for profiles / roles
CREATE POLICY "Team can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "View own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- LEADS
-- =========================================================================
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identity
  name TEXT,
  parent_name TEXT,
  student_name TEXT,
  phone TEXT,
  email TEXT,
  age INT,
  -- Geo
  country TEXT,
  city TEXT,
  -- Interest
  instrument TEXT,
  learning_goal public.learning_goal,
  skill_level public.skill_level,
  -- Attribution
  source public.lead_source NOT NULL DEFAULT 'manual',
  campaign_source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Pipeline
  status public.lead_status NOT NULL DEFAULT 'new',
  score INT NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_score ON public.leads(score DESC);
CREATE INDEX idx_leads_source ON public.leads(source);
CREATE INDEX idx_leads_assigned ON public.leads(assigned_to);
CREATE INDEX idx_leads_last_activity ON public.leads(last_activity_at DESC);
CREATE INDEX idx_leads_created ON public.leads(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view leads" ON public.leads
  FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "Team can insert leads" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "Team can update leads" ON public.leads
  FOR UPDATE TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));
CREATE POLICY "Admins can delete leads" ON public.leads
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- LEAD LABELS (many-to-many via junction)
-- =========================================================================
CREATE TABLE public.lead_label_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  label public.lead_label NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lead_id, label)
);
CREATE INDEX idx_lead_labels_lead ON public.lead_label_assignments(lead_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_label_assignments TO authenticated;
GRANT ALL ON public.lead_label_assignments TO service_role;
ALTER TABLE public.lead_label_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team manages labels" ON public.lead_label_assignments
  FOR ALL TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));

-- =========================================================================
-- QUALIFICATION
-- =========================================================================
CREATE TABLE public.qualification_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  student_age INT,
  instrument TEXT,
  country TEXT,
  skill_level public.skill_level,
  goal public.learning_goal,
  preferred_timing TEXT,
  learning_format TEXT,
  budget public.budget_level,
  urgency public.urgency_level,
  raw_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_qual_lead ON public.qualification_responses(lead_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qualification_responses TO authenticated;
GRANT ALL ON public.qualification_responses TO service_role;
ALTER TABLE public.qualification_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team manages qualification" ON public.qualification_responses
  FOR ALL TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));

CREATE TABLE public.lead_score_breakdown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL UNIQUE REFERENCES public.leads(id) ON DELETE CASCADE,
  demographic INT NOT NULL DEFAULT 0,
  geographic INT NOT NULL DEFAULT 0,
  program_fit INT NOT NULL DEFAULT 0,
  intent INT NOT NULL DEFAULT 0,
  urgency INT NOT NULL DEFAULT 0,
  budget INT NOT NULL DEFAULT 0,
  engagement INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  ai_summary TEXT,
  ai_next_action TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_score_breakdown TO authenticated;
GRANT ALL ON public.lead_score_breakdown TO service_role;
ALTER TABLE public.lead_score_breakdown ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team manages scoring" ON public.lead_score_breakdown
  FOR ALL TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));

-- =========================================================================
-- ACTIVITIES (generic event log for future agents)
-- =========================================================================
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activities_lead ON public.activities(lead_id, created_at DESC);
CREATE INDEX idx_activities_kind ON public.activities(kind);
GRANT SELECT, INSERT ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team views activities" ON public.activities
  FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "Team writes activities" ON public.activities
  FOR INSERT TO authenticated WITH CHECK (public.is_team_member(auth.uid()));

-- =========================================================================
-- TASKS
-- =========================================================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority public.task_priority NOT NULL DEFAULT 'normal',
  status public.task_status NOT NULL DEFAULT 'pending',
  due_at TIMESTAMPTZ,
  rule_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_lead ON public.tasks(lead_id);
CREATE INDEX idx_tasks_assigned_status ON public.tasks(assigned_to, status);
CREATE INDEX idx_tasks_due ON public.tasks(due_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team manages tasks" ON public.tasks
  FOR ALL TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));

-- =========================================================================
-- RE-ENGAGEMENT
-- =========================================================================
CREATE TABLE public.reengagement_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.reengagement_type NOT NULL,
  trigger_days INT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reengagement_campaigns TO authenticated;
GRANT ALL ON public.reengagement_campaigns TO service_role;
ALTER TABLE public.reengagement_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team views campaigns" ON public.reengagement_campaigns
  FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "Admin/Marketing manages campaigns" ON public.reengagement_campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'marketing'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'marketing'));

CREATE TABLE public.reengagement_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.reengagement_campaigns(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  outcome TEXT,
  recovered BOOLEAN NOT NULL DEFAULT FALSE,
  revenue_recovered NUMERIC(12,2)
);
CREATE INDEX idx_reengagement_sends_lead ON public.reengagement_sends(lead_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reengagement_sends TO authenticated;
GRANT ALL ON public.reengagement_sends TO service_role;
ALTER TABLE public.reengagement_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team manages reengagement sends" ON public.reengagement_sends
  FOR ALL TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));

-- =========================================================================
-- NOTIFICATIONS
-- =========================================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user_unread ON public.notifications(user_id, read_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users mark own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Team inserts notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (public.is_team_member(auth.uid()));

-- =========================================================================
-- AI RUNS (foundation for V4 Founder Copilot / analytics)
-- =========================================================================
CREATE TABLE public.ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purpose TEXT NOT NULL,
  model TEXT NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  prompt_summary TEXT,
  input_tokens INT,
  output_tokens INT,
  latency_ms INT,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_runs_created ON public.ai_runs(created_at DESC);
GRANT SELECT, INSERT ON public.ai_runs TO authenticated;
GRANT ALL ON public.ai_runs TO service_role;
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team views ai runs" ON public.ai_runs
  FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "Team writes ai runs" ON public.ai_runs
  FOR INSERT TO authenticated WITH CHECK (public.is_team_member(auth.uid()));

-- =========================================================================
-- REVIEWS stub (foundation for V6)
-- =========================================================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  platform TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  responded BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team manages reviews" ON public.reviews
  FOR ALL TO authenticated USING (public.is_team_member(auth.uid())) WITH CHECK (public.is_team_member(auth.uid()));

-- =========================================================================
-- Generic updated_at trigger
-- =========================================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_campaigns_updated BEFORE UPDATE ON public.reengagement_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
