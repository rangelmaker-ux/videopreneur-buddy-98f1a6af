import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { VideoConfigsProvider, useVideoConfigs } from "@/contexts/VideoConfigsContext";
import { SyncBadge } from "@/components/SyncBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, LogOut, Calculator, FileText, Users, BarChart3, Settings, Plus, Eye, EyeOff } from "lucide-react";
import CalculatorTab from "@/components/tabs/CalculatorTab";
import ConfigTab from "@/components/tabs/ConfigTab";
import QuotesTab from "@/components/tabs/QuotesTab";
import FixedClientsTab from "@/components/tabs/FixedClientsTab";
import ResultsTab from "@/components/tabs/ResultsTab";
import { ParticlesBg } from "@/components/ParticlesBg";
import { SupportChat } from "@/components/SupportChat";
import { UserAvatarMenu } from "@/components/UserAvatarMenu";
import { WelcomeOverlay } from "@/components/WelcomeOverlay";
import logoUrl from "@/assets/logo.png";

function IndexInner() {
  const { user, signOut } = useAuth();
  const { syncStatus } = useVideoConfigs();
  const [tab, setTab] = useState("calculator");
  const [showWelcome, setShowWelcome] = useState(false);
  const [valuesHidden, setValuesHidden] = useState(() => {
    try {
      return localStorage.getItem("vmi:values_hidden") === "true";
    } catch {
      return false;
    }
  });

  const toggleValuesVisibility = () => {
    const newVal = !valuesHidden;
    setValuesHidden(newVal);
    try {
      localStorage.setItem("vmi:values_hidden", String(newVal));
      // Dispatch storage event so other components or re-renders pick it up
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  useEffect(() => {
    try {
      if (sessionStorage.getItem("vmi:justLoggedIn") === "1") {
        sessionStorage.removeItem("vmi:justLoggedIn");
        setShowWelcome(true);
      }
    } catch {}
  }, []);

  return (
    <div className="min-h-screen pb-32 relative animate-fade-in">
      {showWelcome && (
        <WelcomeOverlay
          name={(user?.user_metadata?.display_name as string) || user?.email || null}
          onDone={() => setShowWelcome(false)}
        />
      )}

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
            <UserAvatarMenu />
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
            <CalculatorTab onSaved={() => setTab("quotes")} />
          </TabsContent>
          <TabsContent value="quotes" className="mt-6">
            <QuotesTab />
          </TabsContent>
          <TabsContent value="clients" className="mt-6">
            <FixedClientsTab />
          </TabsContent>
          <TabsContent value="config" className="mt-6">
            <ConfigTab />
          </TabsContent>
          <TabsContent value="results" className="mt-6">
            <ResultsTab />
          </TabsContent>
        </Tabs>
      </section>

      {/* FABs */}
      <SupportChat />
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
