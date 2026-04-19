import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { VideoConfigsProvider, useVideoConfigs } from "@/contexts/VideoConfigsContext";
import { SyncBadge } from "@/components/SyncBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, LogOut, Calculator, FileText, Users, BarChart3, Settings, Plus, MessageCircle } from "lucide-react";
import CalculatorTab from "@/components/tabs/CalculatorTab";
import ConfigTab from "@/components/tabs/ConfigTab";
import { ParticlesBg } from "@/components/ParticlesBg";
import logoUrl from "@/assets/logo.png";

function IndexInner() {
  const { user, signOut } = useAuth();
  const { syncStatus } = useVideoConfigs();
  const [tab, setTab] = useState("calculator");

  const initials = (user?.user_metadata?.display_name || user?.email || "U")
    .split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen pb-32 relative">
      {/* Topbar */}
      <header className="sticky top-0 z-30 topbar-glass overflow-hidden">
        <ParticlesBg />
        <div className="container relative flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={logoUrl} alt="Videomaker Inteligente" className="h-10 w-10 shrink-0 rounded-xl object-contain drop-shadow-[0_4px_12px_hsl(222_75%_45%/0.35)]" />
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold leading-tight truncate tracking-tight">Videomaker Inteligente</p>
              <div className="hidden sm:block leading-tight">
                <SyncBadge status={syncStatus} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground border border-border">
              {initials}
            </div>
            <Button variant="ghost" size="icon" onClick={() => signOut()} aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <section className="container mt-6">
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

          <TabsContent value="calculator" className="mt-6">
            <CalculatorTab />
          </TabsContent>
          <TabsContent value="config" className="mt-6">
            <ConfigTab />
          </TabsContent>
          {["quotes", "clients", "results"].map((key) => (
            <TabsContent key={key} value={key} className="mt-6">
              <div className="glass rounded-2xl p-8 text-center">
                <p className="text-sm text-muted-foreground">Será construída na próxima etapa.</p>
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

export default function Index() {
  return (
    <VideoConfigsProvider>
      <IndexInner />
    </VideoConfigsProvider>
  );
}
