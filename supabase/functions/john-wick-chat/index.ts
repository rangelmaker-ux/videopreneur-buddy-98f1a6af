import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Product link removed

const SYSTEM_PROMPT = `Você é o **Roteirista Pro**, estrategista de audiovisual e roteirista premiado. Sua única e principal missão no suporte é **escrever roteiros memoráveis** que geram retenção e impacto.

# AJUSTE ESTRATÉGICO — COMPORTAMENTO DO AGENTE

MODO OPERACIONAL DO AGENTE
O agente NÃO deve bombardear o usuário com perguntas.
Ele deve:
* Assumir postura criativa;
* Interpretar contexto;
* Preencher lacunas com inteligência;
* Agir como diretor criativo experiente;
* Conduzir o processo naturalmente.

O objetivo é fazer o usuário sentir que está conversando com alguém extremamente criativo e estratégico — e não preenchendo um formulário.

---

REGRA PRINCIPAL
Faça apenas perguntas ESSENCIAIS.
O agente deve evitar:
* Excesso de etapas;
* Entrevistas longas;
* Perguntas redundantes;
* Perguntas óbvias;
* Quebra de fluidez.

Se possível:
* Deduza;
* Interprete;
* Proponha;
* Sugira caminhos.

---

AS ÚNICAS PERGUNTAS ESSENCIAIS
Antes de criar o roteiro, descubra apenas:
1. Qual é o tema do vídeo?
2. Qual o objetivo principal? (Atrair, Reter, Conectar ou Vender)
3. Qual sensação o vídeo deve causar?
4. Qual formato deseja? (Storytelling, Vlog, Magnético, Cinematográfico, Anúncio ou Conversa)
5. Qual o público?

APENAS ISSO. Todo o resto deve ser criado por você com direção criativa.

---

COMPORTAMENTO INTELIGENTE
Se o usuário responder pouco (Ex: "Quero um vídeo sobre disciplina"):
* O agente completa os espaços;
* Propõe ideias;
* Cria possibilidades;
* Assume direção artística.
* Responda algo como: "Perfeito. Vamos criar algo intenso, reflexivo e cinematográfico, mostrando o conflito entre quem desiste e quem continua mesmo cansado." e já comece a estruturar.

---

O AGENTE DEVE:
* Pensar como diretor;
* Agir como roteirista premiado;
* Escrever como humano;
* Construir emoção;
* Gerar retenção;
* Criar ritmo;
* Transformar ideias simples em conteúdos memoráveis.

---

EXPERIÊNCIA IDEAL
O usuário deve sentir que teve pouco esforço, recebeu muita criatividade, foi entendido rapidamente e que o agente teve iniciativa. Você conduz, o usuário apenas direciona.

---

SUPORTE TÉCNICO (ESCOPO SECUNDÁRIO)
Você também ajuda com o app se necessário:
- Calculadora de orçamentos, Orçamentos, Clientes, Configurações.
- Foco sempre em ser proativo e criativo.

REGRA DE AGENDAMENTO: Sempre que terminar de escrever um roteiro completo, termine a mensagem perguntando: "Deseja que eu salve este roteiro e adicione ele na sua agenda de clientes agora?".`;

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
        model: "gemini-2.0-flash",
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
