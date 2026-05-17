import { useState, useRef, useEffect } from "react";
import { Send, Plus, MessageSquare, Trash2, User, Loader2, Menu, X, Sparkles, FolderPlus, ChevronRight, ChevronDown, MoreVertical, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Folder {
  id: string;
  name: string;
}

interface Chat {
  id: string;
  title: string;
  created_at: string;
  folder_id: string | null;
}

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

const ROBOT_AVATAR_URL = "https://images.unsplash.com/photo-1546776310-eef45dd6d63c?q=80&w=200&h=200&auto=format&fit=crop";

export default function ScriptWriterTab() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openFolders, setOpenFolders] = useState<string[]>([]);
  const isMobile = useIsMobile();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchChats(), fetchFolders()]);
  };

  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from("roteirista_folders")
      .select("*")
      .order("name", { ascending: true });
    
    if (error) {
      console.error("Error fetching folders:", error);
      return;
    }
    setFolders(data || []);
  };

  useEffect(() => {
    if (currentChatId) {
      fetchMessages(currentChatId);
    } else {
      setMessages([]);
    }
  }, [currentChatId]);

  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
    else setIsSidebarOpen(true);
  }, [isMobile]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const fetchChats = async () => {
    const { data, error } = await supabase
      .from("roteirista_chats")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching chats:", error);
      return;
    }
    setChats(data || []);
  };

  const fetchMessages = async (chatId: string) => {
    const { data, error } = await supabase
      .from("roteirista_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    
    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }
    setMessages((data as any[])?.map(m => ({
      ...m,
      role: m.role as "user" | "assistant"
    })) || []);
  };

  const createNewChat = async (title: string = "Novo Roteiro", folderId: string | null = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado");
        return null;
      }

      const { data, error } = await supabase
        .from("roteirista_chats")
        .insert({ title, user_id: user.id, folder_id: folderId })
        .select()
        .single();
      
      if (error) throw error;
      
      setChats([data, ...chats]);
      setCurrentChatId(data.id);
      if (isMobile) setIsSidebarOpen(false);
      return data.id;
    } catch (err) {
      toast.error("Erro ao criar novo chat");
      return null;
    }
  };

  const createNewFolder = async () => {
    const name = prompt("Nome da pasta/cliente:");
    if (!name) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("roteirista_folders")
        .insert({ name, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      setFolders([...folders, data]);
      toast.success("Pasta criada");
    } catch (err) {
      toast.error("Erro ao criar pasta");
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      const { error } = await supabase
        .from("roteirista_folders")
        .delete()
        .eq("id", folderId);
      
      if (error) throw error;
      setFolders(folders.filter(f => f.id !== folderId));
      setChats(chats.map(c => c.folder_id === folderId ? { ...c, folder_id: null } : c));
      toast.success("Pasta removida");
    } catch (err) {
      toast.error("Erro ao remover pasta");
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from("roteirista_chats")
        .delete()
        .eq("id", chatId);
      
      if (error) throw error;
      
      setChats(chats.filter(c => c.id !== chatId));
      if (currentChatId === chatId) setCurrentChatId(null);
      toast.success("Chat deletado");
    } catch (err) {
      toast.error("Erro ao deletar chat");
    }
  };

  const handleSend = async (overrideMsg?: string) => {
    const userMsg = overrideMsg || input.trim();
    if (!userMsg || isLoading) return;

    if (!overrideMsg) setInput("");
    
    setIsLoading(true);
    let chatId = currentChatId;

    try {
      // 1. Ensure we have a chat session
      if (!chatId) {
        chatId = await createNewChat(userMsg.slice(0, 30) + (userMsg.length > 30 ? "..." : ""));
        if (!chatId) return;
      }

      // 2. Save user message to DB
      const { error: msgError } = await supabase
        .from("roteirista_messages")
        .insert({
          chat_id: chatId,
          role: "user",
          content: userMsg
        });
      
      if (msgError) throw msgError;

      // Update local state for immediate feedback
      const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
      setMessages(newMessages);

      // 3. Call Edge Function
      const { data, error: functionError } = await supabase.functions.invoke("roteirista-pro", {
        body: { messages: newMessages },
      });

      if (functionError) {
        if (functionError.message?.includes("Failed to fetch")) {
          throw new Error("Erro de rede: Não foi possível alcançar o servidor. Verifique sua conexão.");
        }
        throw functionError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const assistantMessage = data?.choices?.[0]?.message;
      if (assistantMessage) {
        // 4. Save assistant message to DB
        const { error: saveError } = await supabase
          .from("roteirista_messages")
          .insert({
            chat_id: chatId,
            role: "assistant",
            content: assistantMessage.content
          });
        
        if (saveError) throw saveError;

        setMessages([...newMessages, assistantMessage]);
      } else {
        console.error("Data received from Edge Function:", data);
        throw new Error("A IA não retornou uma resposta válida.");
      }
    } catch (err: any) {
      console.error("Erro no chat:", err);
      toast.error(`Erro: ${err.message || "Tente novamente."}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] w-full max-w-6xl mx-auto gap-4 animate-fade-in overflow-hidden">
      {/* Sidebar - Chat History */}
      <aside 
        className={cn(
          "flex flex-col border border-primary/20 bg-background/50 backdrop-blur-sm rounded-2xl transition-all duration-300 overflow-hidden",
          isSidebarOpen ? "w-64" : "w-0 md:w-0",
          isMobile && !isSidebarOpen ? "hidden" : "flex",
          isMobile && "fixed inset-0 z-50 w-full rounded-none"
        )}
      >
        <div className="p-4 border-b border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span>Histórico</span>
          </div>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="p-3">
          <Button 
            onClick={() => createNewChat()}
            className="w-full justify-start gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
            variant="ghost"
          >
            <Plus className="h-4 w-4" />
            Novo Roteiro
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 pb-4">
          <div className="space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  setCurrentChatId(chat.id);
                  if (isMobile) setIsSidebarOpen(false);
                }}
                className={cn(
                  "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all text-sm",
                  currentChatId === chat.id 
                    ? "bg-primary/20 text-primary font-medium border border-primary/20 shadow-sm" 
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                <span className="truncate flex-1 pr-2">{chat.title}</span>
                <button
                  onClick={(e) => deleteChat(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <Card className="flex flex-col flex-1 overflow-hidden border-primary/20 bg-background/50 backdrop-blur-sm shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-primary/10 bg-muted/30">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 overflow-hidden border border-primary/20 shadow-lg">
                <img 
                  src={ROBOT_AVATAR_URL} 
                  alt="Roteirista Pro" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-display text-base font-bold leading-none">Roteirista Pro</h3>
                <p className="text-[10px] text-muted-foreground mt-1">Especialista em Viralização</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-6 max-w-4xl mx-auto pb-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center space-y-4 opacity-80">
                  <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center overflow-hidden border border-primary/10 shadow-inner">
                    <img src={ROBOT_AVATAR_URL} alt="Bot" className="h-full w-full object-cover" />
                  </div>
                  <div className="space-y-2 max-w-md">
                    <h4 className="text-lg font-bold text-primary">Pronto para viralizar?</h4>
                    <p className="text-sm text-muted-foreground px-4">
                      Me conte sua ideia de vídeo e eu transformarei em um roteiro estratégico, emocional e altamente assistível.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-lg px-4">
                    <button 
                      onClick={() => handleSend("Crie um roteiro sobre 3 erros comuns de iniciantes no Reels")}
                      className="text-xs p-4 rounded-xl border border-primary/10 bg-muted/40 hover:bg-primary/5 hover:border-primary/30 transition-all text-left flex items-start gap-2 group"
                    >
                      <Sparkles className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                      <span>"3 erros comuns de iniciantes no Reels"</span>
                    </button>
                    <button 
                      onClick={() => handleSend("Roteiro para vlog dinâmico de 30 segundos mostrando bastidores")}
                      className="text-xs p-4 rounded-xl border border-primary/10 bg-muted/40 hover:bg-primary/5 hover:border-primary/30 transition-all text-left flex items-start gap-2 group"
                    >
                      <Sparkles className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                      <span>"Vlog dinâmico de bastidores"</span>
                    </button>
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-3 animate-fade-in",
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm overflow-hidden",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground border border-primary/10"
                    )}
                  >
                    {m.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <img src={ROBOT_AVATAR_URL} alt="Bot" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "relative max-w-[85%] rounded-2xl px-5 py-4 text-sm shadow-sm",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted/80 backdrop-blur-sm border border-primary/5 rounded-tl-none prose prose-sm prose-invert dark:prose-neutral max-w-full"
                    )}
                  >
                    <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3 animate-fade-in">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted border border-primary/10 overflow-hidden">
                    <img src={ROBOT_AVATAR_URL} alt="Bot" className="h-full w-full object-cover opacity-50" />
                  </div>
                  <div className="bg-muted/80 backdrop-blur-sm border border-primary/5 rounded-2xl rounded-tl-none px-5 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-primary/10 bg-muted/20">
            <div className="relative max-w-4xl mx-auto flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Qual sua ideia hoje? Ex: Dicas de edição, Vlog, Review..."
                className="flex min-h-[60px] max-h-[200px] w-full rounded-2xl border border-primary/20 bg-background/50 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all duration-200"
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="h-[60px] w-[60px] shrink-0 rounded-2xl shadow-lg bg-gradient-to-tr from-primary to-primary/80 hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-[9px] text-center text-muted-foreground mt-2 hidden sm:block">
              Pressione Enter para enviar, Shift+Enter para quebra de linha.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
