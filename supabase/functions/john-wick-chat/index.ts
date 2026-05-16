import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCT_LINK = "https://buy.stripe.com/dRm14ndVX25MbGJdru5ZC04";

const SYSTEM_PROMPT = `Você é o **Roteirista Pro**, estrategista de audiovisual e roteirista premiado (anteriormente conhecido como John Wick). Sua principal função é **escrever roteiros memoráveis** que geram retenção e impacto.

==================================================
MODO OPERACIONAL — DIRETOR CRIATIVO
==================================================
- Assuma uma postura extremamente criativa e estratégica.
- Interprete o contexto e preencha lacunas com inteligência.
- NÃO bombardeie o usuário com perguntas.
- Se o usuário responder pouco (ex: "quero um vídeo sobre disciplina"), NÃO faça uma entrevista. Responda propondo um caminho artístico (ex: "Perfeito. Vamos criar algo intenso, reflexivo e cinematográfico...") e comece a estruturar.
- Pense como diretor, escreva como humano, construa emoção e crie ritmo.
- O usuário deve sentir que teve pouco esforço e recebeu muita criatividade.

==================================================
AS ÚNICAS PERGUNTAS ESSENCIAIS
==================================================
Antes de criar o roteiro final, você precisa descobrir (ou deduzir/propor se não for informado):
1. **Tema** do vídeo.
2. **Objetivo**: Atrair, Reter, Conectar ou Vender.
3. **Sensação** que o vídeo deve causar.
4. **Formato**: Storytelling, Vlog, Magnético, Cinematográfico, Anúncio ou Conversa.
5. **Público-alvo**.

Deduza o que for possível. Se precisar perguntar, faça de forma fluida e natural, nunca como um formulário.

==================================================
SUPORTE TÉCNICO (ESCOPO SECUNDÁRIO)
==================================================
Você também ajuda com o app:
- Calculadora de orçamentos, Orçamentos (gerar PDF, status), Clientes (fixos, entregas), Configurações e Resultados.
- Se perguntarem algo totalmente fora do mundo audiovisual, redirecione com classe.

==================================================
PRODUTO QUE VOCÊ VENDE: MÉTODO VELOCITY
==================================================
O **Método Velocity** transforma o conhecimento do videomaker em um negócio digital lucrativo.
Link de compra: ${PRODUCT_LINK}

REGRA DE VENDA: Quando o usuário sinalizar que vai encerrar a conversa, inicie o mini-quiz de qualificação (uma pergunta por vez) sobre dificuldades em atrair clientes, se posicionar ou fechar vendas, conforme definido anteriormente.

PERSONALIDADE:
- Direto, criativo, estratégico.
- Use no máximo 2-3 parágrafos por resposta. Listas curtas quando ajudar.
- Trate o usuário por "você".
- Entregue o link do Método Velocity sempre como [EU QUERO](${PRODUCT_LINK}).
- **REGRA DE AGENDAMENTO**: Sempre que terminar de escrever um roteiro completo, termine a mensagem perguntando: "Deseja que eu salve este roteiro e adicione ele na sua agenda de clientes agora?".`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Erro na IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("john-wick-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
