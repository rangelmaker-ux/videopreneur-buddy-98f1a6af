// GraphQL proxy: blocks introspection (__schema / __type) for anonymous users
// and forwards everything else to the Supabase GraphQL endpoint.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://xlnzttdxmxuywxmwjmpd.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const GRAPHQL_ENDPOINT = `${SUPABASE_URL}/graphql/v1`;

const INTROSPECTION_REGEX = /\b__(schema|type)\b/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { query?: string; variables?: unknown; operationName?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const query = body?.query ?? "";
  if (typeof query !== "string" || query.trim().length === 0) {
    return new Response(JSON.stringify({ error: "Missing GraphQL query" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validate auth: introspection only allowed for authenticated users
  const authHeader = req.headers.get("Authorization") ?? "";
  let isAuthenticated = false;

  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token && token !== SUPABASE_ANON_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data, error } = await supabase.auth.getUser(token);
        isAuthenticated = !!data?.user && !error;
      } catch {
        isAuthenticated = false;
      }
    }
  }

  if (!isAuthenticated && INTROSPECTION_REGEX.test(query)) {
    return new Response(
      JSON.stringify({
        errors: [{ message: "Introspection queries are not allowed for anonymous users." }],
      }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Forward to upstream Supabase GraphQL
  const upstreamHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
  };
  if (authHeader) upstreamHeaders["Authorization"] = authHeader;

  try {
    const upstream = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Upstream request failed", detail: String(err) }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
