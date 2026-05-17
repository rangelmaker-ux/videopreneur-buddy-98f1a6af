import { useState, useEffect } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export const TrialWelcomePopup = () => {
  const { accessStatus, trialDaysRemaining } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (accessStatus === "trial") {
      const hasShown = localStorage.getItem("trial_popup_shown");
      if (!hasShown) {
        setIsOpen(true);
      }
    }
  }, [accessStatus]);

  const handleClose = () => {
    localStorage.setItem("trial_popup_shown", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-[420px] bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="text-5xl mb-6">🎉</span>
          
          <h2 className="text-2xl font-bold mb-3 text-zinc-900 dark:text-white">
            Bem-vindo ao seu período gratuito!
          </h2>
          
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            Você tem <span className="font-bold text-zinc-900 dark:text-white">{trialDaysRemaining} dias</span> de acesso completo ao Videomaker Inteligente. Aproveite tudo sem limitações.
          </p>

          <div className="w-full space-y-3 mb-8 text-left bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl">
            <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <span>Calculadora profissional</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <span>Assistente Roteirista Pro IA</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <span>Gestão de clientes</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <span>Orçamentos ilimitados</span>
            </div>
          </div>

          <div className="w-full border-t border-zinc-100 dark:border-zinc-800 my-6" />

          <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-6">
            Ao encerrar o período de teste, escolha entre Mensal R$57/mês ou Anual R$399/ano.
          </p>

          <Button 
            onClick={handleClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-semibold rounded-xl"
          >
            Entendido, vamos lá! →
          </Button>
        </div>
      </div>
    </div>
  );
};
