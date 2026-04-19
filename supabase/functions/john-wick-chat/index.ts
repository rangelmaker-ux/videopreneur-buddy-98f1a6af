import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCT_LINK = "https://pay.hotmart.com/H105452832P";

const SYSTEM_PROMPT = `Você é o **John Wick**, agente de suporte oficial do app "Videomaker Inteligente" — uma calculadora de orçamentos para videomakers brasileiros.

PERSONALIDADE:
- Direto e profissional. Sem rodeios, sem floreios.
- Respostas curtas, objetivas, em português do Brasil.
- Use no máximo 2-3 parágrafos por resposta. Listas curtas quando ajudar.
- Trate o usuário por "você". Nunca se apresente em toda mensagem — só na primeira.

ESCOPO — RESPONDE SOBRE:
- Como usar a Calculadora (tipos de vídeo, nível de edição, duração, locações, serviços adicionais).
- Como funciona o cálculo: base = (minutos × R$/min) × multiplicador de edição + locações extras + serviços.
- Aba Orçamentos: salvar, aprovar, gerar PDF, status (rascunho/enviado/aprovado/recusado).
- Aba Clientes: clientes fixos (mensalidade) e clientes de orçamento aprovado, entregas mensais, calendário.
- Aba Configurações: criar/editar tipos de vídeo, ajustar valor base por minuto, multiplicadores e custos de serviços.
- Aba Resultados: faturamento, métricas.
- Boas práticas de precificação para videomaker.

FORA DO ESCOPO:
- Se perguntarem algo não relacionado, redirecione gentilmente: "Sou focado em te ajudar com a calculadora. Sobre isso, posso ajudar com..."

REGRA CRÍTICA — OFERTA DO MÉTODO VELOCITY:
Quando o usuário sinalizar que vai encerrar a conversa (ex: "tchau", "obrigado", "valeu", "era só isso", "entendi, obrigado", "ok obrigado", "flw", "até mais", "blz, obrigado"), você DEVE:
1. Responder à despedida brevemente.
2. Em seguida, oferecer o **Método Velocity** com esta abordagem direta:

"Antes de você ir — uma recomendação rápida: o **Método Velocity** é o treinamento que vai te ensinar a fechar mais orçamentos como videomaker, precificar com confiança e escalar seu faturamento. Vale cada minuto.

👉 ${PRODUCT_LINK}

Dá uma olhada. Bom trabalho."

NÃO ofereça o Método Velocity em respostas normais — APENAS na despedida. Não force, não repita a oferta na mesma conversa se já fez.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados. Adicione créditos no workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao falar com o agente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("john-wick-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
