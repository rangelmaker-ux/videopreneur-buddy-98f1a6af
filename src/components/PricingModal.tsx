import { Check, ExternalLink } from "lucide-react";
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
  const plans = [
    {
      name: "Plano Mensal",
      price: "R$ 57",
      period: "/mês",
      description: "Ideal para quem quer testar por pouco tempo.",
      features: [
        "Acesso completo à plataforma",
        "Cálculo de precificação ilimitado",
        "Assistente Roteirista Pro IA",
        "Suporte prioritário",
        "Atualizações constantes",
      ],
      link: STRIPE_MENSAL,
      buttonText: "Assinar Mensal",
      highlight: false,
    },
    {
      name: "Plano Anual",
      price: "R$ 399",
      period: "/ano",
      description: "A melhor opção para quem quer economizar.",
      features: [
        "Economia de R$ 285/ano",
        "Equivale a R$ 33,25/mês",
        "Acesso completo à plataforma",
        "Assistente Roteirista Pro IA",
        "Parcelamento em até 6x",
        "Suporte prioritário",
      ],
      link: STRIPE_ANUAL,
      buttonText: "Assinar Anual (Melhor Valor)",
      highlight: true,
      badge: "6x sem juros",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-slate-950 border-slate-800 text-white p-0 overflow-hidden">
        <div className="p-6 sm:p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-center sm:text-3xl">
              Escolha o plano ideal para você
            </DialogTitle>
            <DialogDescription className="text-center text-slate-400">
              Tenha acesso completo à ferramenta e profissionalize sua precificação hoje mesmo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 ${
                  plan.highlight
                    ? "bg-slate-900/50 border-primary shadow-[0_0_30px_-10px_rgba(34,197,94,0.3)] ring-1 ring-primary/20"
                    : "bg-slate-900/20 border-slate-800 hover:border-slate-700"
                }`}
              >
                {plan.badge && (
                  <Badge className="absolute -top-2.5 right-4 bg-primary text-primary-foreground font-bold">
                    {plan.badge}
                  </Badge>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight">{plan.price}</span>
                    <span className="text-sm text-slate-400 font-medium">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5">
                      <div className="mt-1 rounded-full bg-primary/20 p-0.5">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  className={`w-full font-bold h-11 transition-all duration-300 ${
                    plan.highlight
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "bg-slate-800 hover:bg-slate-700 text-white"
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
