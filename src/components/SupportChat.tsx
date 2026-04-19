import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/john-wick-chat`;
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const INITIAL: Msg = {
  role: "assistant",
  content:
    "Olá, sou **John Wick**, suporte do Videomaker Inteligente. Posso te ajudar com a calculadora, orçamentos, clientes, configurações e precificação.\n\nEm que posso ajudar?",
};

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([INITIAL]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Extract quiz options (1️⃣..4️⃣) from the last assistant message
  const quizOptions = useMemo(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return [];
    const numberEmojis: Record<string, number> = {
      "1️⃣": 1, "2️⃣": 2, "3️⃣": 3, "4️⃣": 4,
    };
    const found: { number: number; label: string; reply: string }[] = [];
    const lines = last.content.split("\n");
    for (const raw of lines) {
      const line = raw.trim();
      for (const [emoji, num] of Object.entries(numberEmojis)) {
        if (line.startsWith(emoji)) {
          const label = line.slice(emoji.length).replace(/^[\s:.\-—)]+/, "").trim();
          if (label && !found.find((o) => o.number === num)) {
            found.push({ number: num, label, reply: `${num} - ${label}` });
          }
          break;
        }
      }
    }
    return found.length >= 2 ? found.sort((a, b) => a.number - b.number) : [];
  }, [messages]);

  // Detect Yes/No prompt (acceptance question to start quiz)
  const yesNoPrompt = useMemo(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return false;
    if (quizOptions.length > 0) return false;
    const t = last.content.toLowerCase();
    return (
      t.includes("posso te fazer") &&
      t.includes("perguntas rápidas") &&
      t.includes("faturamento")
    );
  }, [messages, quizOptions]);

  const send = useCallback(
    async (override?: string) => {
      const text = (override ?? input).trim();
      if (!text || loading) return;

      const userMsg: Msg = { role: "user", content: text };
      const next = [...messages, userMsg];
      setMessages(next);
      if (!override) setInput("");
      setLoading(true);

      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: next }),
        });

        if (resp.status === 429) {
          toast.error("Muitas requisições. Aguarde um instante.");
          setLoading(false);
          return;
        }
        if (resp.status === 402) {
          toast.error("Limite de uso atingido. Tente mais tarde.");
          setLoading(false);
          return;
        }
        if (!resp.ok || !resp.body) throw new Error("Falha na conexão");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let assistantSoFar = "";
        let streamDone = false;
        let started = false;

        const flushAssistant = (chunk: string) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            if (!started) {
              started = true;
              return [...prev, { role: "assistant", content: assistantSoFar }];
            }
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: assistantSoFar } : m,
              );
            }
            return [...prev, { role: "assistant", content: assistantSoFar }];
          });
        };

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let nl: number;
          while ((nl = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, nl);
            textBuffer = textBuffer.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              streamDone = true;
              break;
            }
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) flushAssistant(content);
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      } catch (e) {
        console.error(e);
        toast.error("Erro ao falar com o John Wick. Tente novamente.");
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages],
  );

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full glass-strong text-foreground hover:text-primary transition-colors shadow-[var(--shadow-elegant)]"
        aria-label="Suporte com John Wick"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {open && (
        <div
          className="fixed bottom-24 left-4 right-4 sm:right-auto sm:left-6 sm:w-[380px] z-40 flex flex-col rounded-2xl glass-strong border border-border/60 shadow-[var(--shadow-elegant)] animate-fade-in overflow-hidden"
          style={{ height: "min(560px, calc(100vh - 140px))" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3 bg-gradient-primary/10">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground font-display font-bold text-sm">
              JW
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-semibold leading-tight">John Wick</p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Suporte • Calculadora & Orçamentos
              </p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-gradient-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted/60 text-foreground rounded-bl-sm"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none prose-p:my-1.5 prose-a:text-primary prose-a:underline prose-strong:text-foreground">
                      <ReactMarkdown
                        remarkPlugins={[remarkBreaks]}
                        components={{
                          a: ({ node, ...props }) => (
                            <a {...props} target="_blank" rel="noopener noreferrer" />
                          ),
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-muted/60 rounded-2xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            {!loading && quizOptions.length > 0 && (
              <div className="flex flex-col gap-1.5 pl-1 animate-fade-in">
                {quizOptions.map((opt) => (
                  <button
                    key={opt.number}
                    onClick={() => send(opt.reply)}
                    className="text-left text-xs sm:text-sm rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/15 hover:border-primary/70 transition-colors px-3 py-2 text-foreground"
                  >
                    <span className="font-semibold text-primary mr-1.5">{opt.number}️⃣</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border/50 p-2.5 bg-background/40">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Pergunte sobre a calculadora..."
                rows={1}
                maxLength={1000}
                className="flex-1 resize-none rounded-xl bg-muted/40 border border-border/60 px-3 py-2 text-sm outline-none focus:border-primary/60 max-h-24"
                disabled={loading}
              />
              <Button
                size="icon"
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 shrink-0"
                aria-label="Enviar"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
