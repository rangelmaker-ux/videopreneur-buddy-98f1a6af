// Webhook Hotmart — recebe notificações de PURCHASE_APPROVED e libera acesso
// Endpoint público (sem JWT). Validação por HOTTOK enviado no header/payload.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hotmart-hottok",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const APPROVED_STATUSES = new Set([
  "APPROVED",
  "approved",
  "COMPLETE",
  "complete",
]);

const REVOKE_EVENTS = new Set([
  "PURCHASE_REFUNDED",
  "PURCHASE_CHARGEBACK",
  "PURCHASE_CANCELED",
  "PURCHASE_EXPIRED",
  "SUBSCRIPTION_CANCELLATION",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const HOTTOK = Deno.env.get("HOTMART_HOTTOK");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!HOTTOK || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error("Missing env vars");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json().catch(() => ({} as any));

    // Hotmart envia o hottok no header OU no corpo (depending on integration version)
    const headerToken =
      req.headers.get("x-hotmart-hottok") ||
      req.headers.get("X-HOTMART-HOTTOK");
    const bodyToken = payload?.hottok || payload?.data?.hottok;
    const providedToken = headerToken || bodyToken;

    if (providedToken !== HOTTOK) {
      console.warn("Invalid HOTTOK", { provided: providedToken ? "present" : "missing" });
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hotmart Webhook 2.0: { event, data: { buyer: { email, name }, purchase: { status, transaction }, product: { id } } }
    // Hotmart Postback (legacy): plano com email, status, prod, transaction direto
    const event: string = payload?.event || payload?.data?.event || "PURCHASE_APPROVED";

    const buyerEmail: string | undefined =
      payload?.data?.buyer?.email ||
      payload?.buyer?.email ||
      payload?.email;

    const buyerName: string | undefined =
      payload?.data?.buyer?.name ||
      payload?.buyer?.name ||
      payload?.name;

    const purchaseStatus: string | undefined =
      payload?.data?.purchase?.status ||
      payload?.purchase?.status ||
      payload?.status;

    const transaction: string | undefined =
      payload?.data?.purchase?.transaction ||
      payload?.purchase?.transaction ||
      payload?.transaction;

    const productId: string | undefined =
      String(payload?.data?.product?.id ?? payload?.product?.id ?? payload?.prod ?? "") || undefined;

    if (!buyerEmail) {
      console.warn("No buyer email in payload");
      return new Response(JSON.stringify({ error: "Missing buyer email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const email = buyerEmail.trim().toLowerCase();

    // Revogação
    if (REVOKE_EVENTS.has(event)) {
      const { error } = await supabase
        .from("compradores_aprovados")
        .update({ status_compra: "revogado", subscription_status: "canceled", raw_payload: payload, updated_at: new Date().toISOString() })
        .eq("email", email);
      if (error) console.error("Revoke error", error);
      return new Response(JSON.stringify({ ok: true, action: "revoked", email }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Aprovação
    const isApproved =
      event === "PURCHASE_APPROVED" ||
      event === "PURCHASE_COMPLETE" ||
      (purchaseStatus && APPROVED_STATUSES.has(purchaseStatus));

    if (!isApproved) {
      console.log("Event ignored:", event, purchaseStatus);
      return new Response(JSON.stringify({ ok: true, action: "ignored", event }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase
      .from("compradores_aprovados")
      .upsert(
        {
          email,
          status_compra: "PURCHASE_COMPLETE",
          subscription_status: "active",
          payment_gateway: "hotmart",
          buyer_name: buyerName ?? null,
          hotmart_transaction: transaction ?? null,
          hotmart_product_id: productId ?? null,
          last_payment_at: new Date().toISOString(),
          raw_payload: payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

    if (error) {
      console.error("Upsert error", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, action: "approved", email }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
