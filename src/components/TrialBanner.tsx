import { useAuth, STRIPE_MENSAL, STRIPE_ANUAL } from "@/contexts/AuthContext";
import { ExternalLink } from "lucide-react";

export function TrialBanner() {
  const { accessStatus, trialDaysRemaining } = useAuth();

  if (accessStatus !== "trial") return null;

  const isLastDay = trialDaysRemaining === 1;
  const bgColor = isLastDay ? "bg-[#fee2e2]" : "bg-[#fef3c7]";
  const textColor = isLastDay ? "text-[#991b1b]" : "text-[#92400e]";
  const icon = isLastDay ? "🚨" : "⏳";
  const message = isLastDay 
    ? "Último dia do seu teste gratuito!" 
    : `Teste gratuito — ${trialDaysRemaining} dias restantes`;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] flex flex-col sm:flex-row items-center justify-center gap-3 px-4 py-2 text-sm font-medium shadow-sm transition-colors duration-300 ${bgColor} ${textColor}`}>
      <span className="flex items-center gap-1.5">
        <span>{icon}</span>
        {message}
      </span>
      <div className="flex items-center gap-2">
        <a 
          href={STRIPE_MENSAL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-white/50 px-3 py-1 text-xs hover:bg-white/80 transition-colors"
        >
          Mensal R$57/mês <ExternalLink className="h-3 w-3" />
        </a>
        <a 
          href={STRIPE_ANUAL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-white/50 px-3 py-1 text-xs hover:bg-white/80 transition-colors font-bold"
        >
          Anual R$399/ano <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
