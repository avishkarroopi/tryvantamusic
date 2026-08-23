
-- Google Integration Framework — isolated module
-- Table 1: connected Google account + encrypted refresh token
CREATE TABLE public.google_integrations (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  google_email text NOT NULL,
  refresh_token_ciphertext text NOT NULL,
  refresh_token_iv text NOT NULL,
  refresh_token_tag text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_integrations TO authenticated;
GRANT ALL ON public.google_integrations TO service_role;

ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage google integrations"
  ON public.google_integrations
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER google_integrations_touch_updated_at
  BEFORE UPDATE ON public.google_integrations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Table 2: auto-discovered Google resources
CREATE TABLE public.google_discovered_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  display_name text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource_type, resource_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_discovered_resources TO authenticated;
GRANT ALL ON public.google_discovered_resources TO service_role;

ALTER TABLE public.google_discovered_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage google discovered resources"
  ON public.google_discovered_resources
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER google_discovered_resources_touch_updated_at
  BEFORE UPDATE ON public.google_discovered_resources
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_google_discovered_resources_user_type
  ON public.google_discovered_resources (user_id, resource_type);
