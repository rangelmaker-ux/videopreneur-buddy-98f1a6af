import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Mic, MicOff, AlertCircle, Save, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import johnWickAvatar from "@/assets/john-wick-avatar.png";
import { useFixedClients, Delivery } from "@/hooks/useFixedClients";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/john-wick-chat`;
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const INITIAL: Msg = {
  role: "assistant",
  content:
    "Olá! Eu sou o **Roteirista Pro**. Estou aqui para criar roteiros épicos com você.\n\nQual o tema do seu próximo vídeo?",
};

export default function ScriptWriterTab() {
  const [messages, setMessages] = useState<Msg[]>([INITIAL]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micError, setMicError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { clients, deliveries, createDelivery, updateDelivery } = useFixedClients();

  const [schedulingData, setSchedulingData] = useState<{
    content: string;
    clientId: string;
    deliveryId: string;
    date: string;
  } | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "pt-BR";
      recognition.onstart = () => { setIsListening(true); setIsProcessing(false); setMicError(false); };
      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) {
          setInput(prev => {
            const base = prev.trim();
            return base ? `${base} ${finalTranscript.trim()}` : finalTranscript.trim();
          });
        }
      };
      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') setMicError(true);
        setIsListening(false);
        setIsProcessing(false);
      };
      recognition.onend = () => {
        setIsListening(false);
        setIsProcessing(false);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = useCallback(async () => {
    if (!recognitionRef.current) {
      toast.error("Reconhecimento de voz não suportado.");
      return;
    }
    if (isListening) {
      setIsProcessing(true);
      recognitionRef.current.stop();
      return;
    }
    try {
      setMicError(false);
      setIsProcessing(true);
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      recognitionRef.current.start();
    } catch (err) {
      setMicError(true);
      setIsProcessing(false);
    }
  }, [isListening]);

  const send = useCallback(async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;

    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    if (!override) setInput("");
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: PUBLISHABLE_KEY,
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ messages: next, agentType: 'script' }),
      });

      if (!resp.ok || !resp.body) throw new Error("Falha");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let assistantSoFar = "";
      let started = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        let textBuffer = "";
        let streamDone = false;

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
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantSoFar += content;
                setMessages(prev => {
                  if (!started) {
                    started = true;
                    return [...prev, { role: "assistant", content: assistantSoFar }];
                  }
                  return prev.map((m, idx) => idx === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                });
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      }
      
      // Auto-save removed as per user request

    } catch (e) {
      toast.error("Erro ao gerar roteiro.");
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleSaveScript = async (content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.from("scripts").insert({
        user_id: user.id,
        title: "Roteiro Gerado",
        content: content,
      }).select().single();

      if (error) throw error;
      toast.success("Roteiro salvo com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar roteiro.");
    }
  };

  const handleSchedule = async (content: string) => {
    if (clients.length === 0) {
      toast.error("Cadastre um cliente primeiro na aba Clientes.");
      return;
    }
    setSchedulingData({
      content,
      clientId: clients[0]?.id || "",
      deliveryId: "new",
      date: new Date().toISOString().split('T')[0],
    });
    setIsScheduleDialogOpen(true);
  };

  const confirmScheduling = async () => {
    if (!schedulingData) return;
    try {
      if (schedulingData.deliveryId === "new") {
        await createDelivery({
          fixed_client_id: schedulingData.clientId,
          title: "Gravação: Roteiro Gerado",
          script: schedulingData.content,
          delivery_date: schedulingData.date,
          status: 'scheduled'
        });
      } else {
        await updateDelivery(schedulingData.deliveryId, {
          script: schedulingData.content,
          delivery_date: schedulingData.date
        });
      }
      toast.success("Roteiro agendado com sucesso!");
      setIsScheduleDialogOpen(false);
    } catch (err) {
      toast.error("Erro ao agendar.");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto glass-strong rounded-2xl border border-border/60 overflow-hidden shadow-2xl animate-fade-in">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-gradient-primary/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={johnWickAvatar} alt="Roteirista Pro" className="h-12 w-12 rounded-full ring-2 ring-primary/40 shadow-glow" />
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-background" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg leading-tight flex items-center gap-2">
              Roteirista Pro <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            </h2>
            <p className="text-xs text-muted-foreground">Estrategista de Audiovisual</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`group relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === "user" ? "bg-gradient-primary text-primary-foreground rounded-br-sm" : "bg-muted/40 text-foreground rounded-bl-sm border border-border/40"
            }`}>
              {m.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>{m.content}</ReactMarkdown>
                  {i > 0 && !loading && i === messages.length - 1 && (
                    <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border/20">
                      <div className="flex gap-2">

                        <Button size="sm" variant="outline" className="h-8 gap-2 bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary" onClick={() => handleSchedule(m.content)}>
                          <Calendar className="h-3.5 w-3.5" /> Sim, agendar na agenda
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted/40 rounded-2xl px-4 py-3 border border-border/40">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-muted/20 border-t border-border/50">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleListening}
            className={`h-11 w-11 rounded-xl transition-all ${isListening ? "bg-red-500 text-white animate-pulse" : ""}`}
          >
            {isListening ? <MicOff /> : <Mic className={micError ? "text-amber-500" : ""} />}
          </Button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Descreva o tema do vídeo..."
            rows={1}
            className="flex-1 min-h-[44px] max-h-32 p-3 bg-background/50 border border-border/60 rounded-xl resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <Button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="h-11 px-6 rounded-xl bg-gradient-primary font-bold shadow-glow"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </div>
      </div>

      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agendar Roteiro</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client">Cliente</Label>
              <Select 
                value={schedulingData?.clientId} 
                onValueChange={(val) => setSchedulingData(prev => prev ? ({ ...prev, clientId: val, deliveryId: "new" }) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="delivery">Vincular a uma entrega existente?</Label>
              <Select 
                value={schedulingData?.deliveryId} 
                onValueChange={(val) => setSchedulingData(prev => prev ? ({ ...prev, deliveryId: val }) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Criar nova entrega" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Criar nova entrega</SelectItem>
                  {deliveries
                    .filter(d => d.fixed_client_id === schedulingData?.clientId)
                    .map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.title || "Sem título"} ({d.delivery_date || "Sem data"})</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {schedulingData?.deliveryId === "new" && (
              <div className="grid gap-2">
                <Label htmlFor="date">Data da Gravação/Entrega</Label>
                <Input 
                  type="date" 
                  value={schedulingData?.date} 
                  onChange={(e) => setSchedulingData(prev => prev ? ({ ...prev, date: e.target.value }) : null)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmScheduling}>Confirmar Agendamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
