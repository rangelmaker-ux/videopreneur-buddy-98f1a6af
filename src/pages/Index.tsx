import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, LogOut, Calculator, FileText, Users, BarChart3, Settings, Plus, MessageCircle, CloudCheck } from "lucide-react";

export default function Index() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState("calculator");

  const initials = (user?.user_metadata?.display_name || user?.email || "U")
    .split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen pb-32">
      {/* Topbar */}
      <header className="sticky top-0 z-30 glass border-b border-border/50">
        <div className="container flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-primary">
              <Sparkles className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-bold leading-tight truncate">Videomaker Inteligente</p>
              <p className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground leading-tight">
                <CloudCheck className="h-3 w-3 text-success" /> Salvo na nuvem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-accent text-xs font-bold text-secondary-foreground shadow-[var(--shadow-elegant)]">
              {initials}
            </div>
            <Button variant="ghost" size="icon" onClick={() => signOut()} aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero — etapa 1 placeholder */}
      <section className="container mt-8 mb-6 animate-fade-in">
        <div className="glass rounded-2xl p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-wider text-primary mb-2">Bem-vindo</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">
            Olá, <span className="gradient-text">{user?.user_metadata?.display_name || "videomaker"}</span> 👋
          </h1>
          <p className="text-sm text-muted-foreground max-w-prose">
            Sua conta está ativa. Nas próximas etapas vamos liberar a calculadora de precificação, gestão de orçamentos, clientes fixos e dashboard de resultados.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="container">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-5 bg-muted/40 h-auto p-1">
            <TabsTrigger value="calculator" className="flex flex-col gap-1 py-2 text-[11px] sm:text-xs sm:flex-row">
              <Calculator className="h-4 w-4" /><span className="hidden sm:inline">Calculadora</span><span className="sm:hidden">Calc</span>
            </TabsTrigger>
            <TabsTrigger value="quotes" className="flex flex-col gap-1 py-2 text-[11px] sm:text-xs sm:flex-row">
              <FileText className="h-4 w-4" /><span>Orçamentos</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex flex-col gap-1 py-2 text-[11px] sm:text-xs sm:flex-row">
              <Users className="h-4 w-4" /><span>Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex flex-col gap-1 py-2 text-[11px] sm:text-xs sm:flex-row">
              <BarChart3 className="h-4 w-4" /><span>Resultados</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex flex-col gap-1 py-2 text-[11px] sm:text-xs sm:flex-row">
              <Settings className="h-4 w-4" /><span>Config</span>
            </TabsTrigger>
          </TabsList>

          {["calculator", "quotes", "clients", "results", "config"].map((key) => (
            <TabsContent key={key} value={key} className="mt-6">
              <div className="glass rounded-2xl p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Esta seção será construída na próxima etapa.
                </p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* FABs */}
      <a
        href="https://instagram.com"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 flex h-12 w-12 items-center justify-center rounded-full glass-strong text-foreground hover:text-primary transition-colors shadow-[var(--shadow-elegant)]"
        aria-label="Suporte"
      >
        <MessageCircle className="h-5 w-5" />
      </a>
      <button
        onClick={() => setTab("calculator")}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow)] hover:scale-105 transition-transform"
        aria-label="Criar novo orçamento"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
