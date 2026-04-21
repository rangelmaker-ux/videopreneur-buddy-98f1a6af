-- 1) Garantir RLS ativo em compradores_aprovados (defesa em profundidade)
ALTER TABLE public.compradores_aprovados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compradores_aprovados FORCE ROW LEVEL SECURITY;

-- 2) Restringir grants da função is_email_approved
-- A função é SECURITY DEFINER e precisa continuar acessível para a edge function
-- check-approved-email (que usa service_role) e para usuários autenticados.
REVOKE ALL ON FUNCTION public.is_email_approved(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_email_approved(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_email_approved(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_email_approved(text) TO service_role;