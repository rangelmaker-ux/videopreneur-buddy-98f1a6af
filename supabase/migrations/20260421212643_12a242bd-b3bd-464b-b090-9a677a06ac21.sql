CREATE OR REPLACE FUNCTION is_email_approved(_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM compradores_aprovados
    WHERE lower(email) = lower(trim(_email))
      AND status_compra = 'PURCHASE_COMPLETE'
      AND subscription_status = 'active'
      AND (
        subscription_expires_at IS NULL 
        OR subscription_expires_at > NOW()
      )
  );
END;
$$;