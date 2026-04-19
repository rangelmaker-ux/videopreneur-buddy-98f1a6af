-- Bloqueia qualquer acesso direto via API pública (anon/authenticated)
-- O webhook da Hotmart usa service_role, que bypassa RLS automaticamente.
-- A função is_email_approved é SECURITY DEFINER, então também não é afetada.

CREATE POLICY "Deny all client select on compradores_aprovados"
  ON public.compradores_aprovados
  FOR SELECT
  TO anon, authenticated
  USING (false);

CREATE POLICY "Deny all client insert on compradores_aprovados"
  ON public.compradores_aprovados
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "Deny all client update on compradores_aprovados"
  ON public.compradores_aprovados
  FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny all client delete on compradores_aprovados"
  ON public.compradores_aprovados
  FOR DELETE
  TO anon, authenticated
  USING (false);