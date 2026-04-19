
-- Tabela de compradores aprovados (vindos do webhook Hotmart)
CREATE TABLE public.compradores_aprovados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  status_compra TEXT NOT NULL DEFAULT 'aprovado',
  hotmart_transaction TEXT,
  hotmart_product_id TEXT,
  buyer_name TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_compradores_email ON public.compradores_aprovados(lower(email));

ALTER TABLE public.compradores_aprovados ENABLE ROW LEVEL SECURITY;

-- Nenhuma policy pública: somente edge functions (service role) acessam.
-- Usuários autenticados não precisam ler essa tabela diretamente.

-- Função SECURITY DEFINER para checar se um email está aprovado (usada pelo trigger e edge function)
CREATE OR REPLACE FUNCTION public.is_email_approved(_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.compradores_aprovados
    WHERE lower(email) = lower(_email) AND status_compra = 'aprovado'
  );
$$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compradores_updated_at
  BEFORE UPDATE ON public.compradores_aprovados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger que cria profile automaticamente E bloqueia signup se email não está aprovado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bloqueia se o email não estiver na tabela de compradores aprovados
  IF NOT public.is_email_approved(NEW.email) THEN
    RAISE EXCEPTION 'EMAIL_NOT_APPROVED: Este email não foi encontrado entre os compradores aprovados na Hotmart.'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
