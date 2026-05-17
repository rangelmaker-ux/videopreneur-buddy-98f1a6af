import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Trash2, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ROBOT_AVATAR_URL = "https://images.unsplash.com/photo-1546776310-eef45dd6d63c?q=80&w=200&h=200&auto=format&fit=crop";

export default function ScriptWriterTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleSend = async (overrideMsg?: string) => {
    const userMsg = overrideMsg || input.trim();
    if (!userMsg || isLoading) return;

    if (!overrideMsg) setInput("");
    
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      console.log("Calling roteirista-pro-chat with messages:", newMessages);
      const { data, error } = await supabase.functions.invoke("roteirista-pro-chat", {
        body: { messages: newMessages },
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw error;
      }

      console.log("Received data from roteirista-pro-chat:", data);

      if (data?.choices?.[0]?.message) {
        setMessages([...newMessages, data.choices[0].message]);
      } else if (data?.error) {
        throw new Error(data.error.message || data.error);
      } else {
        console.error("Unexpected response structure:", data);
        throw new Error("Resposta da IA em formato inesperado.");
      }
    } catch (err: any) {
      console.error("Erro detalhado ao falar com Roteirista Pro:", err);
      toast.error(`Erro: ${err.message || "Tente novamente."}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Conversa limpa!");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px] w-full max-w-4xl mx-auto gap-4 animate-fade-in">
      <Card className="flex flex-col flex-1 overflow-hidden border-primary/20 bg-background/50 backdrop-blur-sm shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary/10 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 overflow-hidden border border-primary/20 shadow-lg">
              <img 
                src={ROBOT_AVATAR_URL} 
                alt="Roteirista Pro" 
                className="h-full w-full object-cover transition-transform hover:scale-110"
              />
            </div>
            <div>
              <h3 className="font-display text-base font-bold leading-none">Roteirista Pro</h3>
              <p className="text-[10px] text-muted-foreground mt-1">IA Especialista em Viralização</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Limpar conversa"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center space-y-4 opacity-60">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border border-primary/10">
                  <img src={ROBOT_AVATAR_URL} alt="Bot" className="h-full w-full object-cover" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Olá! Eu sou o Roteirista Pro.</p>
                  <p className="text-xs text-muted-foreground px-8">
                    Me conte sua ideia de vídeo e eu transformarei em um roteiro viral estratégico usando o método OCA.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                  <button 
                    onClick={() => handleSend("Quero criar um vídeo sobre dicas de edição para Reels")}
                    className="text-[10px] p-2 rounded-lg border border-primary/10 hover:bg-primary/5 transition-colors text-left"
                  >
                    "Dicas de edição para Reels"
                  </button>
                  <button 
                    onClick={() => handleSend("Roteiro para vlog de um dia de trabalho como videomaker")}
                    className="text-[10px] p-2 rounded-lg border border-primary/10 hover:bg-primary/5 transition-colors text-left"
                  >
                    "Vlog de videomaker"
                  </button>
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 ${
                  m.role === "user" ? "flex-row-reverse" : "flex-row"
                } animate-fade-in`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm overflow-hidden ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground border border-primary/10"
                  }`}
                >
                  {m.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <img src={ROBOT_AVATAR_URL} alt="Bot" className="h-full w-full object-cover" />
                  )}
                </div>
                <div
                  className={`relative max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted/80 backdrop-blur-sm border border-primary/5 rounded-tl-none prose prose-sm prose-invert dark:prose-neutral max-w-full"
                  }`}
                >
                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 animate-fade-in">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground border border-primary/10 overflow-hidden">
                  <img src={ROBOT_AVATAR_URL} alt="Bot" className="h-full w-full object-cover opacity-50" />
                </div>
                <div className="bg-muted/80 backdrop-blur-sm border border-primary/5 rounded-2xl rounded-tl-none px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-primary/10 bg-muted/20">
          <div className="relative max-w-3xl mx-auto flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Digite sua ideia aqui..."
              className="flex min-h-[50px] w-full rounded-xl border border-primary/20 bg-background/50 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all duration-200"
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-[50px] w-[50px] shrink-0 rounded-xl shadow-lg bg-gradient-to-tr from-primary to-primary/80 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-[9px] text-center text-muted-foreground mt-2">
            Pressione Enter para enviar, Shift+Enter para nova linha.
          </p>
        </div>
      </Card>
    </div>
  );
}
