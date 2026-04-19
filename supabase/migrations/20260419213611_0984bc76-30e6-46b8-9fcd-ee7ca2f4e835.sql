-- Expandir fixed_client_deliveries com campos de agendamento, roteiro e status
ALTER TABLE public.fixed_client_deliveries
  ADD COLUMN IF NOT EXISTS recording_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_date date,
  ADD COLUMN IF NOT EXISTS script text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'scheduled';

-- Tornar delivered_at opcional (entregas agendadas ainda não foram entregues)
ALTER TABLE public.fixed_client_deliveries
  ALTER COLUMN delivered_at DROP NOT NULL,
  ALTER COLUMN delivered_at DROP DEFAULT;

-- Garantir valores válidos de status via trigger (CHECK pode ser restritivo demais)
CREATE OR REPLACE FUNCTION public.validate_delivery_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('scheduled','recorded','editing','delivered','posted') THEN
    RAISE EXCEPTION 'INVALID_STATUS: % não é um status válido', NEW.status;
  END IF;

  -- Auto-preencher delivered_at quando status virar delivered/posted
  IF NEW.status IN ('delivered','posted') AND NEW.delivered_at IS NULL THEN
    NEW.delivered_at := now();
  END IF;

  -- Derivar cycle_month/cycle_year de recording_at (se houver) ou delivery_date ou now()
  IF NEW.cycle_month IS NULL OR NEW.cycle_year IS NULL THEN
    DECLARE
      ref_date timestamptz := COALESCE(NEW.recording_at, NEW.delivery_date::timestamptz, NEW.delivered_at, now());
    BEGIN
      NEW.cycle_year := EXTRACT(YEAR FROM ref_date)::int;
      NEW.cycle_month := EXTRACT(MONTH FROM ref_date)::int;
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_delivery_status ON public.fixed_client_deliveries;
CREATE TRIGGER trg_validate_delivery_status
  BEFORE INSERT OR UPDATE ON public.fixed_client_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_delivery_status();

-- Índices para o calendário (busca por intervalo de datas) e por cliente
CREATE INDEX IF NOT EXISTS idx_deliveries_user_recording
  ON public.fixed_client_deliveries (user_id, recording_at);

CREATE INDEX IF NOT EXISTS idx_deliveries_user_cycle
  ON public.fixed_client_deliveries (user_id, cycle_year, cycle_month);
