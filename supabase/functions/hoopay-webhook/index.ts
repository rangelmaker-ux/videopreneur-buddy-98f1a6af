import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const HOOPAY_CLIENT_ID = Deno.env.get("HOOPAY_CLIENT_ID")!;
const HOOPAY_CLIENT_SECRET = Deno.env.get("HOOPAY_CLIENT_SECRET")!;
const HOOPAY_WEBHOOK_TOKEN = Deno.env.get("HOOPAY_WEBHOOK_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function getHoopayToken(): Promise<string | null> {
  try {
    const res = await fetch("https://api.hoopay.com.br/auth/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: HOOPAY_CLIENT_ID,
        client_secret: HOOPAY_CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

async function verifyOrderPaid(orderId: number, token: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.hoopay.com.br/organizations/orders/${orderId}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.order?.statusId === 2;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const authHeader = req.headers.get("Authorization") || "";
  const urlToken = new URL(req.url).searchParams.get("token") || "";
  const receivedToken = authHeader.replace("Bearer ", "").trim() || urlToken;

  if (!HOOPAY_WEBHOOK_TOKEN || receivedToken !== HOOPAY_WEBHOOK_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const email = payload?.client?.email;
  const buyerName = payload?.client?.name || "";
  const orderId = payload?.orderId;
  const statusId = payload?.order?.statusId;
  const amountPaid = payload?.amount?.amount;

  if (statusId !== 2) {
    return new Response(JSON.stringify({ received: true, processed: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!email || !orderId) return new Response("Missing data", { status: 400 });

  const hoopayToken = await getHoopayToken();
  if (hoopayToken) {
    const isPaid = await verifyOrderPaid(orderId, hoopayToken);
    if (!isPaid) return new Response("Order not confirmed paid", { status: 402 });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { error } = await supabaseAdmin
    .from("compradores_aprovados")
    .upsert({
      email: email.toLowerCase().trim(),
      buyer_name: buyerName,
      status_compra: "PURCHASE_COMPLETE",
      payment_gateway: "hoopay",
      hoopay_order_id: orderId,
      amount: amountPaid,
    }, { onConflict: "email" });

  if (error) return new Response("Internal server error", { status: 500 });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
