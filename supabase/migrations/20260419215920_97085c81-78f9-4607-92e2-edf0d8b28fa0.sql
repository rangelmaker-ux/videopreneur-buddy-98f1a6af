-- Permite entregas ligadas a orçamento (sem cliente fixo)
ALTER TABLE public.fixed_client_deliveries
  ALTER COLUMN fixed_client_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES public.quotes(id) ON DELETE CASCADE;

-- Garante que toda entrega tenha pelo menos uma origem
ALTER TABLE public.fixed_client_deliveries
  DROP CONSTRAINT IF EXISTS deliveries_source_chk;
ALTER TABLE public.fixed_client_deliveries
  ADD CONSTRAINT deliveries_source_chk
  CHECK (fixed_client_id IS NOT NULL OR quote_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_deliveries_quote_id
  ON public.fixed_client_deliveries(quote_id);

-- Trigger: ao aprovar/fechar um orçamento, cria entrega vinculada (uma vez)
CREATE OR REPLACE FUNCTION public.create_delivery_from_quote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approved_statuses text[] := ARRAY['approved','closed','accepted','aprovado','fechado'];
  existing_id uuid;
BEGIN
  IF NEW.status = ANY(approved_statuses)
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN

    SELECT id INTO existing_id
      FROM public.fixed_client_deliveries
     WHERE quote_id = NEW.id
     LIMIT 1;

    IF existing_id IS NULL THEN
      INSERT INTO public.fixed_client_deliveries (
        user_id, fixed_client_id, quote_id, title, script, location, notes,
        status, recording_at, delivery_date, cycle_year, cycle_month
      ) VALUES (
        NEW.user_id,
        NEW.fixed_client_id,
        NEW.id,
        COALESCE(NULLIF(NEW.project_name,''), 'Orçamento ' || NEW.customer_name),
        COALESCE(NEW.notes,''),
        '',
        'Origem: orçamento aprovado',
        'scheduled',
        NULL,
        NULL,
        EXTRACT(YEAR FROM now())::int,
        EXTRACT(MONTH FROM now())::int
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_delivery_from_quote ON public.quotes;
CREATE TRIGGER trg_create_delivery_from_quote
AFTER INSERT OR UPDATE OF status ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.create_delivery_from_quote();

-- Garante que o trigger de validação de status rode em insert/update das entregas
DROP TRIGGER IF EXISTS trg_validate_delivery_status ON public.fixed_client_deliveries;
CREATE TRIGGER trg_validate_delivery_status
BEFORE INSERT OR UPDATE ON public.fixed_client_deliveries
FOR EACH ROW
EXECUTE FUNCTION public.validate_delivery_status();