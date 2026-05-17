import { Check, ExternalLink, Calculator, Sparkles, FileText, BarChart3, Calendar, Smartphone, RefreshCw, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STRIPE_MENSAL, STRIPE_ANUAL } from "@/contexts/AuthContext";

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PricingModal({ open, onOpenChange }: PricingModalProps) {
  const commonFeatures = [
    { icon: <Calculator className="h-3.5 w-3.5" />, text: "Calculadora de Precificação Avançada" },
    { icon: <Sparkles className="h-3.5 w-3.5" />, text: "Assistente 'Roteirista Pro IA'" },
    { icon: <FileText className="h-3.5 w-3.5" />, text: "Geração e Exportação de Orçamentos" },
    { icon: <BarChart3 className="h-3.5 w-3.5" />, text: "Dashboard de Indicadores e Gráficos" },
    { icon: <Calendar className="h-3.5 w-3.5" />, text: "Agenda Inteligente e Gestão de Clientes" },
    { icon: <Smartphone className="h-3.5 w-3.5" />, text: "Acesso Multiplataforma" },
    { icon: <RefreshCw className="h-3.5 w-3.5" />, text: "Atualizações e Melhorias Constantes" },
    { icon: <Zap className="h-3.5 w-3.5" />, text: "Suporte Prioritário" },
  ];

  const plans = [
    {
      name: "Plano Mensal",
      price: "R$ 57",
      period: "/mês",
      description: "Ideal para quem quer flexibilidade total.",
      features: commonFeatures,
      link: STRIPE_MENSAL,
      buttonText: "Assinar Agora",
      highlight: false,
    },
    {
      name: "Plano Anual",
      price: "R$ 399",
      period: "/ano",
      description: "A escolha premium para profissionais de elite.",
      features: commonFeatures,
      link: STRIPE_ANUAL,
      buttonText: "Assinar Agora",
      highlight: true,
      badge: "Mais Popular",
      savings: "Economize R$ 285",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-slate-950/95 border-slate-800 text-white p-0 overflow-hidden backdrop-blur-xl">
        <div className="p-4 sm:p-6 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-center sm:text-3xl tracking-tight">
              Transforme sua <span className="text-primary">Carreira</span>
            </DialogTitle>
            <DialogDescription className="text-center text-slate-400 text-sm max-w-lg mx-auto">
              Escolha o plano ideal para profissionalizar sua gestão e multiplicar seus resultados com IA.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col p-5 rounded-2xl border transition-all duration-500 group ${
                  plan.highlight
                    ? "bg-slate-900/40 border-primary shadow-[0_0_30px_-10px_rgba(34,197,94,0.2)] ring-1 ring-primary/20 scale-[1.01]"
                    : "bg-slate-900/20 border-slate-800 hover:border-slate-700 shadow-xl"
                } backdrop-blur-md`}
              >
                {plan.badge && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-bold px-3 py-0.5 text-[10px] shadow-lg shadow-primary/20 animate-pulse">
                    {plan.badge}
                  </Badge>
                )}

                <div className="mb-4">
                  <h3 className={`text-lg font-bold ${plan.highlight ? "text-primary" : "text-white"}`}>{plan.name}</h3>
                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="text-3xl font-black tracking-tight">{plan.price}</span>
                    <span className="text-[12px] text-slate-400 font-medium">{plan.period}</span>
                  </div>
                  {plan.savings && (
                    <div className="mt-0.5 text-[11px] font-bold text-primary flex items-center gap-1">
                      <Zap className="h-2.5 w-2.5 fill-primary" />
                      {plan.savings}
                    </div>
                  )}
                  <p className="mt-2 text-[12px] text-slate-400 leading-tight italic">
                    {plan.description}
                  </p>
                </div>

                <div className="space-y-1.5 mb-6 flex-1">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 group/item">
                      <div className={`mt-0.5 rounded p-0.5 transition-colors ${plan.highlight ? "bg-primary/15 text-primary" : "bg-slate-800 text-slate-400 group-hover/item:text-primary group-hover/item:bg-primary/10"}`}>
                        {feature.icon}
                      </div>
                      <span className="text-[13px] text-slate-300 group-hover/item:text-white transition-colors leading-tight">{feature.text}</span>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  className={`w-full font-black h-11 rounded-xl text-sm transition-all duration-500 shadow-xl ${
                    plan.highlight
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-[1.02] hover:shadow-primary/20 active:scale-95 glow-button"
                      : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                  }`}
                >
                  <a href={plan.link} target="_blank" rel="noopener noreferrer">
                    {plan.buttonText}
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-[10px] text-slate-500">
            Pagamento seguro processado pelo Stripe. Cancele quando quiser.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
    </Dialog>
  );
}
