
-- Configurações de precificação por tipo de vídeo (uma linha por tipo, por usuário)
CREATE TABLE public.video_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_type_key TEXT NOT NULL,
  video_type_label TEXT NOT NULL,
  base_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  location_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  freelancer_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  basic_mult NUMERIC(6,3) NOT NULL DEFAULT 1.0,
  inter_mult NUMERIC(6,3) NOT NULL DEFAULT 1.0,
  adv_mult NUMERIC(6,3) NOT NULL DEFAULT 1.0,
  motion_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  color_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  script_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  story_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  drone_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  audio_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  subs_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  multi_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_type_key)
);

CREATE INDEX idx_video_configs_user ON public.video_configs(user_id);

ALTER TABLE public.video_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own video configs"
  ON public.video_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own video configs"
  ON public.video_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own video configs"
  ON public.video_configs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own video configs"
  ON public.video_configs FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_video_configs_updated_at
  BEFORE UPDATE ON public.video_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Dados profissionais do usuário (uma linha por usuário)
CREATE TABLE public.professional_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  cnpj TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.professional_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own professional data"
  ON public.professional_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own professional data"
  ON public.professional_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own professional data"
  ON public.professional_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_professional_data_updated_at
  BEFORE UPDATE ON public.professional_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar tipos de vídeo padrão para novo usuário
CREATE OR REPLACE FUNCTION public.seed_default_video_configs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.video_configs (user_id, video_type_key, video_type_label, sort_order)
  VALUES
    (NEW.id, 'social_media', 'Social Media', 1),
    (NEW.id, 'event_coverage', 'Cobertura de Evento', 2)
  ON CONFLICT (user_id, video_type_key) DO NOTHING;

  INSERT INTO public.professional_data (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_seed
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.seed_default_video_configs();

-- Seed para o usuário atual (já cadastrado)
INSERT INTO public.video_configs (user_id, video_type_key, video_type_label, sort_order)
SELECT u.id, 'social_media', 'Social Media', 1 FROM auth.users u
ON CONFLICT (user_id, video_type_key) DO NOTHING;

INSERT INTO public.video_configs (user_id, video_type_key, video_type_label, sort_order)
SELECT u.id, 'event_coverage', 'Cobertura de Evento', 2 FROM auth.users u
ON CONFLICT (user_id, video_type_key) DO NOTHING;

INSERT INTO public.professional_data (user_id, email)
SELECT u.id, u.email FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;
