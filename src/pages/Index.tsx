import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { VideoConfigsProvider, useVideoConfigs } from "@/contexts/VideoConfigsContext";
import { SyncBadge } from "@/components/SyncBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calculator, FileText, Users, BarChart3, Settings, Plus, Eye, EyeOff, Clapperboard } from "lucide-react";
import CalculatorTab from "@/components/tabs/CalculatorTab";
import ConfigTab from "@/components/tabs/ConfigTab";
import QuotesTab from "@/components/tabs/QuotesTab";
import FixedClientsTab from "@/components/tabs/FixedClientsTab";
import ResultsTab from "@/components/tabs/ResultsTab";
import ScriptWriterTab from "@/components/tabs/ScriptWriterTab";
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
    <div className="min-h-screen pb-20 relative animate-fade-in bg-background">
      {showWelcome && (
        <WelcomeOverlay
          name={(user?.user_metadata?.display_name as string) || user?.email || null}
          onDone={() => setShowWelcome(false)}
        />
      )}

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md transition-all duration-300">
          <div className="container px-4">
            <div className="flex h-14 items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <img 
                  src={logoUrl} 
                  alt="Videomaker Inteligente" 
                  className="h-8 w-8 shrink-0 rounded-lg object-contain shadow-sm" 
                />
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="font-display text-sm font-bold leading-none truncate tracking-tight text-foreground/90">
                    Videomaker Inteligente
                  </p>
                  <div className="mt-0.5">
                    <SyncBadge status={syncStatus} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleValuesVisibility}
                  className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all rounded-full"
                  title={valuesHidden ? "Mostrar valores" : "Ocultar valores"}
                >
                  {valuesHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <div className="h-8 w-px bg-border/40 mx-1" />
                <UserAvatarMenu />
              </div>
            </div>

            <div className="flex items-center justify-center pb-2 pt-0 sm:pb-3 overflow-x-auto no-scrollbar">
              <TabsList className="inline-flex h-10 items-center justify-center rounded-xl bg-muted/40 p-1 text-muted-foreground w-full max-w-2xl">
                <TabsTrigger 
                  value="calculator" 
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2 flex-1 sm:flex-initial"
                >
                  <Calculator className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Calculadora</span>
                  <span className="sm:hidden">Calc</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="scripts" 
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2 flex-1 sm:flex-initial"
                >
                  <Clapperboard className="h-3.5 w-3.5" />
                  <span>Roteiros</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="quotes" 
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2 flex-1 sm:flex-initial"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Orçamentos</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="clients" 
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2 flex-1 sm:flex-initial"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Clientes</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="results" 
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2 flex-1 sm:flex-initial"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Resultados</span>
                  <span className="sm:hidden">Res</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="config" 
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2 flex-1 sm:flex-initial"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Config</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </header>

        <main className="container px-4 py-6">
          <TabsContent value="calculator" className="mt-0 focus-visible:outline-none">
            <CalculatorTab onSaved={() => setTab("quotes")} />
          </TabsContent>
          <TabsContent value="scripts" className="mt-0 focus-visible:outline-none">
            <ScriptWriterTab />
          </TabsContent>
          <TabsContent value="quotes" className="mt-0 focus-visible:outline-none">
            <QuotesTab />
          </TabsContent>
          <TabsContent value="clients" className="mt-0 focus-visible:outline-none">
            <FixedClientsTab />
          </TabsContent>
          <TabsContent value="config" className="mt-0 focus-visible:outline-none">
            <ConfigTab />
          </TabsContent>
          <TabsContent value="results" className="mt-0 focus-visible:outline-none">
            <ResultsTab />
          </TabsContent>
        </main>
      </Tabs>

      {/* FABs */}
      
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
