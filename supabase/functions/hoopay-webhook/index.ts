import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WEBHOOK_TOKEN = Deno.env.get("HOOPAY_WEBHOOK_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

        const urlToken = new URL(req.url).searchParams.get("token") || "";
    if (!WEBHOOK_TOKEN || urlToken !== WEBHOOK_TOKEN) {
          return new Response("Unauthorized", { status: 401 });
    }

        let payload;
    try { payload = await req.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }

        const event = payload?.event;
    if (event !== "purchase_approved") {
          return new Response(JSON.stringify({ received: true, processed: false }), {
                  status: 200, headers: { "Content-Type": "application/json" },
          });
    }

        const email = payload?.data?.customer?.email;
    const buyerName = payload?.data?.customer?.name || "";
    const orderId = String(payload?.data?.id || "");

        if (!email) return new Response("Missing email", { status: 400 });

        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { error } = await supabaseAdmin.from("compradores_aprovados").upsert({
          email: email.toLowerCase().trim(),
          buyer_name: buyerName,
          status_compra: "PURCHASE_COMPLETE",
          payment_gateway: "cakto",
          hoopay_order_id: null,
          amount: null,
    }, { onConflict: "email" });

        if (error) return new Response("Internal server error", { status: 500 });

        return new Response(JSON.stringify({ success: true }), {
              status: 200, headers: { "Content-Type": "application/json" },
        });
});
