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
    const { messages, chatId } = await req.json();
    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!apiKey) {
      console.error("Erro: OPENROUTER_API_KEY não configurada.");
      return new Response(
        JSON.stringify({ error: 'OPENROUTER_API_KEY não encontrada.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Iniciando chamada para OpenRouter para o chat: ${chatId}`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'X-Title': 'Roteirista Pro',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || data.message || 'Erro desconhecido na OpenRouter';
      console.error("Erro da OpenRouter:", errorMessage);
      return new Response(
        JSON.stringify({ error: errorMessage, details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const assistantMessage = data?.choices?.[0]?.message;
    
    if (assistantMessage?.content && chatId && supabaseUrl && supabaseServiceRoleKey) {
      console.log(`Salvando resposta no banco para o chat: ${chatId}`);
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
      
      const { error: saveError } = await supabase
        .from("roteirista_messages")
        .insert({
          chat_id: chatId,
          role: "assistant",
          content: assistantMessage.content
        });
      
      if (saveError) {
        console.error("Erro CRÍTICO ao salvar mensagem no banco:", saveError);
        // Mesmo se falhar ao salvar, retornamos a mensagem para o usuário não ficar sem resposta no UI
      } else {
        console.log("Mensagem salva com sucesso.");
      }
    } else {
      console.warn("Aviso: Mensagem do assistente ou chatId ausentes. Não foi possível salvar no banco.");
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Erro na Edge Function roteirista-pro:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
