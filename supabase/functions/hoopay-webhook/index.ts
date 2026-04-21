import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WEBHOOK_TOKEN = Deno.env.get("HOOPAY_WEBHOOK_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const ACTIVATE_EVENTS = ["purchase_approved","subscription_renewal","subscription_renewed","subscription_created","assinatura_criada","assinatura_renovada"];
const DEACTIVATE_EVENTS = ["refund","subscription_canceled","subscription_expired","chargeback","dispute","subscription_renewal_refused","assinatura_cancelada","reembolso","chargeback_aprovado","renovacao_recusada"];

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const urlToken = new URL(req.url).searchParams.get("token") || "";
  if (!WEBHOOK_TOKEN || urlToken !== WEBHOOK_TOKEN)
    return new Response("Unauthorized", { status: 401 });

  let payload: any;
  try { payload = await req.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }

  const event = payload?.event;
  const email = payload?.data?.customer?.email;
  const buyerName = payload?.data?.customer?.name || "";

  if (!ACTIVATE_EVENTS.includes(event) && !DEACTIVATE_EVENTS.includes(event))
    return new Response(JSON.stringify({ received: true, processed: false }), { status: 200, headers: { "Content-Type": "application/json" } });

  if (!email) return new Response("Missing email", { status: 400 });

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const isActivation = ACTIVATE_EVENTS.includes(event);

  if (isActivation) {
    const expiresAt = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabaseAdmin.from("compradores_aprovados").upsert({
      email: email.toLowerCase().trim(), buyer_name: buyerName,
      status_compra: "PURCHASE_COMPLETE", payment_gateway: "cakto",
      subscription_status: "active", subscription_expires_at: expiresAt,
      last_payment_at: new Date().toISOString(),
    }, { onConflict: "email" });
    if (error) return new Response("Internal server error", { status: 500 });
  } else {
    const { error } = await supabaseAdmin.from("compradores_aprovados")
      .update({ subscription_status: "inactive" })
      .eq("email", email.toLowerCase().trim());
    if (error) return new Response("Internal server error", { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, event, action: isActivation ? "activated" : "deactivated" }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
});
