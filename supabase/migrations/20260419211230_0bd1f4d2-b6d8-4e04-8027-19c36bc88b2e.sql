-- =========================================================
-- QUOTES (Orçamentos) — snapshot completo
-- =========================================================
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,

  customer_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  notes TEXT DEFAULT '',

  status TEXT NOT NULL DEFAULT 'draft', -- draft | sent | approved
  
  -- Snapshot dos inputs
  video_type_key TEXT NOT NULL,
  video_type_label TEXT NOT NULL,
  editing_level TEXT NOT NULL DEFAULT 'basic',
  dur_minutes INT NOT NULL DEFAULT 0,
  dur_seconds INT NOT NULL DEFAULT 0,
  locations INT NOT NULL DEFAULT 1,

  services JSONB NOT NULL DEFAULT '{}'::jsonb, -- { motion: bool, color: bool, ... }
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb, -- snapshot do calcPrice
  total NUMERIC(12,2) NOT NULL DEFAULT 0,

  fixed_client_id UUID, -- opcional, vincula a um cliente fixo

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT quotes_status_check CHECK (status IN ('draft','sent','approved'))
);

CREATE INDEX idx_quotes_user ON public.quotes(user_id, created_at DESC);
CREATE INDEX idx_quotes_status ON public.quotes(user_id, status);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotes_select_own" ON public.quotes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "quotes_insert_own" ON public.quotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "quotes_update_own" ON public.quotes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "quotes_delete_own" ON public.quotes
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- FIXED CLIENTS (Clientes Fixos) — contrato recorrente mensal
-- =========================================================
CREATE TABLE public.fixed_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,

  name TEXT NOT NULL,
  contact TEXT DEFAULT '',
  notes TEXT DEFAULT '',

  videos_per_month INT NOT NULL DEFAULT 1,
  monthly_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  renewal_day INT NOT NULL DEFAULT 1, -- dia do mês de renovação (1..28)
  active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fixed_clients_renewal_day_check CHECK (renewal_day BETWEEN 1 AND 28),
  CONSTRAINT fixed_clients_videos_check CHECK (videos_per_month >= 0)
);

CREATE INDEX idx_fixed_clients_user ON public.fixed_clients(user_id, active, created_at DESC);

ALTER TABLE public.fixed_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fixed_clients_select_own" ON public.fixed_clients
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fixed_clients_insert_own" ON public.fixed_clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fixed_clients_update_own" ON public.fixed_clients
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "fixed_clients_delete_own" ON public.fixed_clients
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_fixed_clients_updated_at
  BEFORE UPDATE ON public.fixed_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- FIXED CLIENT DELIVERIES — entregas do mês corrente
-- =========================================================
CREATE TABLE public.fixed_client_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fixed_client_id UUID NOT NULL REFERENCES public.fixed_clients(id) ON DELETE CASCADE,

  title TEXT NOT NULL DEFAULT '',
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cycle_year INT NOT NULL,
  cycle_month INT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deliveries_user_client ON public.fixed_client_deliveries(user_id, fixed_client_id, cycle_year DESC, cycle_month DESC);

ALTER TABLE public.fixed_client_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deliveries_select_own" ON public.fixed_client_deliveries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "deliveries_insert_own" ON public.fixed_client_deliveries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "deliveries_update_own" ON public.fixed_client_deliveries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "deliveries_delete_own" ON public.fixed_client_deliveries
  FOR DELETE USING (auth.uid() = user_id);