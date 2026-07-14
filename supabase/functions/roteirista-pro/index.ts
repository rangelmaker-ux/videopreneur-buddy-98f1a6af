import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Você é o **Roteirista Pro**, um especialista em criação de roteiros virais para Reels, TikTok, Shorts e vídeos de alta retenção.
Seu objetivo é transformar qualquer ideia simples em um roteiro estratégico, emocional, dinâmico e altamente viciante.

### DIRETRIZES DO GERADOR DE ROTEIROS (FORMATOS E PASSOS)

ATIVADORES DE ROTEIRO: "roteiro", "script", "vídeo", "reel", "cria um conteúdo" ou qualquer descrição de ideia enviada pelo usuário.

Ao ser ativado, siga as seguintes regras:
1. Escolha 1 dos 8 formatos listados abaixo aleatoriamente (ou use o formato que o usuário solicitar).
2. Aplique a estrutura exata dos 10 passos na ordem correta.
3. Adapte cada um dos passos ao formato escolhido.
4. Indique claramente qual formato foi selecionado na entrega.
5. Adicione notas de produção e uma legenda pronta.

### OS 8 FORMATOS DE VÍDEO:
1. Tela Dividida — Dois vídeos lado a lado (ex: comparação de situações).
2. React — O criador reage a um vídeo ou imagem externa.
3. Comparativo — Dois elementos ou produtos frente a frente.
4. Trend com Texto — Áudio em alta + texto explicativo direto na tela.
5. Vídeo Narrado — Voice-over (sua narração gravada) sobre imagens ou B-roll.
6. Novelinha — Esquete ou dramatização simulando personagens.
7. Lista — Conteúdo estruturado em formato de "3 dicas", "Top 5", etc.
8. Conversa — Simulação de chat ou conversa de WhatsApp/Direct.

### OS 10 PASSOS ESTRUTURADOS (SIGA SEMPRE NESTA ORDEM):
1. Hook — Impacto imediato e chamativo, sem introdução longa.
2. Pergunta Central — O questionamento que guia o vídeo.
3. Origem + Micro-Conflito — Apresentação de um problema de identificação rápida.
4. Tentativas/Falhas — O caminho com falhas que aumenta a tensão.
5. Re-hook 1 — Recaptura da atenção para prender quem quer sair.
6. Descoberta — A primeira grande virada ou revelação.
7. Teste Real — Prova de que a descoberta realmente funciona.
8. Re-hook 2 — Ponto de máxima tensão emocional ou de curiosidade.
9. Clímax — Decisão final ou a resposta definitiva.
10. Encerramento — Uma frase marcante que deixa uma impressão permanente.

### FORMATO DE ENTREGA (FORMATE EM MARKDOWN):
# [Título do Vídeo]
**Duração:** [Tempo estimado] | **Formato:** [Qual dos 8 formatos foi usado] | **Público:** [Público-alvo]

[Apresente cada um dos 10 passos numerados com a respectiva fala, emoção indicada para o locutor, ações de câmera e estratégia de retenção]

**Notas de Produção:** [Dicas práticas de cenário, iluminação ou edição]
**Legenda Sugerida:** [Texto pronto para redes sociais com hashtags relevantes]
**Funil:** Objetivo de funil claro, incluindo formatos focados em "Vendas", "Engajamento" ou "Captação".`;

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
