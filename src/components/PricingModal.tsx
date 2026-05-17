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
        <div className="p-6 sm:p-10 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-bold text-center sm:text-4xl tracking-tight">
              Transforme sua <span className="text-primary">Carreira</span>
            </DialogTitle>
            <DialogDescription className="text-center text-slate-400 text-base max-w-lg mx-auto">
              Escolha o plano ideal para profissionalizar sua gestão e multiplicar seus resultados com IA.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-500 group ${
                  plan.highlight
                    ? "bg-slate-900/40 border-primary shadow-[0_0_40px_-10px_rgba(34,197,94,0.2)] ring-1 ring-primary/20 scale-[1.02]"
                    : "bg-slate-900/20 border-slate-800 hover:border-slate-700 shadow-xl"
                } backdrop-blur-md`}
              >
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-bold px-4 py-1 shadow-lg shadow-primary/20 animate-pulse">
                    {plan.badge}
                  </Badge>
                )}

                <div className="mb-6">
                  <h3 className={`text-xl font-bold ${plan.highlight ? "text-primary" : "text-white"}`}>{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                    <span className="text-sm text-slate-400 font-medium">{plan.period}</span>
                  </div>
                  {plan.savings && (
                    <div className="mt-1 text-xs font-bold text-primary flex items-center gap-1">
                      <Zap className="h-3 w-3 fill-primary" />
                      {plan.savings}
                    </div>
                  )}
                  <p className="mt-4 text-sm text-slate-400 leading-relaxed italic">
                    {plan.description}
                  </p>
                </div>

                <div className="space-y-3.5 mb-10 flex-1">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3 group/item">
                      <div className={`mt-0.5 rounded-lg p-1 transition-colors ${plan.highlight ? "bg-primary/15 text-primary" : "bg-slate-800 text-slate-400 group-hover/item:text-primary group-hover/item:bg-primary/10"}`}>
                        {feature.icon}
                      </div>
                      <span className="text-sm text-slate-300 group-hover/item:text-white transition-colors">{feature.text}</span>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  className={`w-full font-black h-14 rounded-2xl text-base transition-all duration-500 shadow-xl ${
                    plan.highlight
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-[1.03] hover:shadow-primary/20 active:scale-95 glow-button"
                      : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                  }`}
                >
                  <a href={plan.link} target="_blank" rel="noopener noreferrer">
                    {plan.buttonText}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            ))}
          </div>


          <p className="mt-8 text-center text-xs text-slate-500">
            Pagamento seguro processado pelo Stripe. Cancele quando quiser.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
