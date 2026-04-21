// Edge Function: admin-actions
// Painel administrativo — só o ADMIN_EMAIL pode executar.
// Ações: list, pause, resume, change_email, send_password_reset, add_buyer, remove_buyer
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const ADMIN_EMAIL = "rangelmaker@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1) Validar usuário chamador via JWT
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Não autenticado" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Sessão inválida" }, 401);

    const callerEmail = userData.user.email?.toLowerCase();
    if (callerEmail !== ADMIN_EMAIL.toLowerCase()) {
      return json({ error: "Acesso negado: você não é administrador" }, 403);
    }

    // 2) Cliente admin (service role)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string;

    switch (action) {
      case "list": {
        // Lista compradores aprovados + correlaciona com auth.users
        const { data: buyers, error: e1 } = await admin
          .from("compradores_aprovados")
          .select("*")
          .order("updated_at", { ascending: false });
        if (e1) return json({ error: e1.message }, 500);

        const { data: usersList, error: e2 } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        if (e2) return json({ error: e2.message }, 500);

        const usersByEmail = new Map<string, any>();
        for (const u of usersList.users) {
          if (u.email) usersByEmail.set(u.email.toLowerCase(), u);
        }

        const rows = (buyers ?? []).map((b: any) => {
          const u = usersByEmail.get((b.email || "").toLowerCase());
          return {
            ...b,
            has_account: !!u,
            user_id: u?.id ?? null,
            last_sign_in_at: u?.last_sign_in_at ?? null,
            account_created_at: u?.created_at ?? null,
          };
        });

        // Usuários com conta mas sem registro em compradores_aprovados
        const orphans = usersList.users
          .filter((u) => u.email && !buyers?.some((b: any) => b.email?.toLowerCase() === u.email!.toLowerCase()))
          .map((u) => ({
            email: u.email,
            user_id: u.id,
            account_created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            has_account: true,
            status_compra: null,
            subscription_status: null,
            payment_gateway: null,
            buyer_name: null,
            orphan: true,
          }));

        return json({ rows, orphans });
      }

      case "pause": {
        const email = String(body.email || "").trim().toLowerCase();
        if (!email) return json({ error: "Email obrigatório" }, 400);
        const { error } = await admin
          .from("compradores_aprovados")
          .update({
            status_compra: "revogado",
            subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("email", email);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      case "resume": {
        const email = String(body.email || "").trim().toLowerCase();
        if (!email) return json({ error: "Email obrigatório" }, 400);
        const { error } = await admin
          .from("compradores_aprovados")
          .update({
            status_compra: "PURCHASE_COMPLETE",
            subscription_status: "active",
            subscription_expires_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("email", email);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      case "change_email": {
        const oldEmail = String(body.oldEmail || "").trim().toLowerCase();
        const newEmail = String(body.newEmail || "").trim().toLowerCase();
        if (!oldEmail || !newEmail) return json({ error: "Emails obrigatórios" }, 400);

        // 1. Atualiza compradores_aprovados
        await admin
          .from("compradores_aprovados")
          .update({ email: newEmail, updated_at: new Date().toISOString() })
          .eq("email", oldEmail);

        // 2. Atualiza auth.users (se existir conta)
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const u = list?.users.find((x) => x.email?.toLowerCase() === oldEmail);
        if (u) {
          const { error: upErr } = await admin.auth.admin.updateUserById(u.id, {
            email: newEmail,
            email_confirm: true,
          });
          if (upErr) return json({ error: upErr.message }, 500);

          // 3. Profiles e professional_data
          await admin.from("profiles").update({ email: newEmail }).eq("user_id", u.id);
          await admin.from("professional_data").update({ email: newEmail }).eq("user_id", u.id);
        }

        return json({ ok: true });
      }

      case "send_password_reset": {
        const email = String(body.email || "").trim().toLowerCase();
        if (!email) return json({ error: "Email obrigatório" }, 400);
        const redirectTo = String(body.redirectTo || "");
        const { error } = await admin.auth.resetPasswordForEmail(email, {
          redirectTo: redirectTo || undefined,
        });
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      case "add_buyer": {
        const email = String(body.email || "").trim().toLowerCase();
        const buyerName = body.buyerName ? String(body.buyerName) : null;
        if (!email) return json({ error: "Email obrigatório" }, 400);

        const { error } = await admin.from("compradores_aprovados").upsert(
          {
            email,
            buyer_name: buyerName,
            status_compra: "PURCHASE_COMPLETE",
            subscription_status: "active",
            payment_gateway: "manual",
            last_payment_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" },
        );
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      case "remove_buyer": {
        const email = String(body.email || "").trim().toLowerCase();
        if (!email) return json({ error: "Email obrigatório" }, 400);
        const { error } = await admin.from("compradores_aprovados").delete().eq("email", email);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      default:
        return json({ error: "Ação desconhecida" }, 400);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("admin-actions error:", msg);
    return json({ error: msg }, 500);
  }
});
