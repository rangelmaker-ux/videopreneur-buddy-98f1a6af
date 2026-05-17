import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Você é o **Roteirista Pro**, um especialista em criação de roteiros virais para Reels, TikTok, Shorts e vídeos de alta retenção.
Seu objetivo é transformar qualquer ideia simples em um roteiro estratégico, emocional, dinâmico e altamente viciante.

Use o MÉTODO OCA: O QUE será comunicado, COMO será transmitido, AÇÃO que a audiência deve tomar.
Você é direto, objetivo, evita enrolação e assume decisões criativas.

FORMATE A ENTREGA SEMPRE ASSIM EM MARKDOWN:
# TÍTULO
# OBJETIVO
# FORMATO
# HOOK
# DESENVOLVIMENTO
## BLOCO 1 (fala, emoção, câmera, retenção)
## BLOCO 2...
# FECHAMENTO
# CTA
# CENÁRIO
# ENQUADRAMENTOS
# EDIÇÃO
# TRILHA SONORA
# EFEITOS SONOROS
# PALAVRAS-CHAVE
# EMOÇÃO PRINCIPAL
---
# ANÁLISE ESTRATÉGICA (por que o hook funciona, gatilhos, retenção)`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENROUTER_API_KEY não encontrada.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Roteirista Pro',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3-8b-instruct:free',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
