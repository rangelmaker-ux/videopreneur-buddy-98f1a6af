import { useState } from "react";
import { useAuth, STRIPE_MENSAL, STRIPE_ANUAL } from "@/contexts/AuthContext";
import { Lock, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TrialExpiredGate() {
  const { accessStatus, checkAccess } = useAuth();
  const [checking, setChecking] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"mensal" | "anual">("anual");

  if (accessStatus !== "trial_expired" && accessStatus !== "blocked") return null;

  const checkoutUrl = selectedPlan === "mensal" ? STRIPE_MENSAL : STRIPE_ANUAL;

  const handleVerify = async () => {
    setChecking(true);
    await checkAccess();
    setChecking(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0f172a] p-4 text-white overflow-y-auto">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Seu período gratuito encerrou</h1>
        <p className="max-w-md text-slate-400">
          Aproveite 7 dias de acesso completo. Para continuar, escolha seu plano abaixo.
        </p>
      </div>

      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-green-500/30 bg-slate-900 shadow-2xl shadow-green-500/10">
        <div className="grid grid-cols-2 gap-2 p-4 bg-slate-800/50">
          <button
            onClick={() => setSelectedPlan("mensal")}
            className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${
              selectedPlan === "mensal"
                ? "bg-slate-700 text-white shadow-inner"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Mensal — R$ 57/mês
          </button>
          <button
            onClick={() => setSelectedPlan("anual")}
            className={`relative rounded-xl px-4 py-3 text-sm font-bold transition-all ${
              selectedPlan === "anual"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Anual — R$ 399/ano ⭐
          </button>
        </div>

        <div className="space-y-4 p-6">
          <ul className="space-y-3">
            {[
              "Calculadora de precificação profissional",
              "Assistente John Wick IA",
              "Gestão de clientes fixos",
              "Histórico de orçamentos",
              "Suporte prioritário",
            ].map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-sm text-slate-300">
                <Check className="h-4 w-4 shrink-0 text-green-500" />
                {benefit}
              </li>
            ))}
          </ul>

          <div className="pt-2 text-center">
            <p className="text-xs text-slate-400">
              Plano anual equivale a R$33,25/mês • parcelável em até 6x • economize R$285
            </p>
          </div>

          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button className="w-full bg-green-600 py-6 text-lg font-bold text-white hover:bg-green-700">
              Assinar agora →
            </Button>
          </a>
        </div>
      </div>

      <button
        onClick={handleVerify}
        disabled={checking}
        className="mt-6 flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-300 disabled:opacity-50"
      >
        {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Já assinei, verificar meu acesso
      </button>
    </div>
  );
}
