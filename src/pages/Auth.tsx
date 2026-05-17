import { useEffect, useState, FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth, STRIPE_MENSAL, STRIPE_ANUAL } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ExternalLink, ShieldCheck, KeyRound, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo3D } from "@/components/Logo3D";
import { LoginSuccessAnimation } from "@/components/LoginSuccessAnimation";
import { PricingModal } from "@/components/PricingModal";

const PAUSED_MESSAGE = "Seu período de acesso gratuito expirou ou a assinatura foi pausada. Para continuar usando a plataforma, escolha um plano.";
const PAUSED_NOTICE_KEY = "vmi:pausedNotice";

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [firstAccessOpen, setFirstAccessOpen] = useState(false);
  const [firstAccessEmail, setFirstAccessEmail] = useState("");
  const [firstAccessChecking, setFirstAccessChecking] = useState(false);
  const [firstAccessResult, setFirstAccessResult] = useState<
    { ok: true } | { ok: false; msg: string } | null
  >(null);

  const [paused, setPaused] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(PAUSED_NOTICE_KEY) === "1") {
        setPaused(true);
        setError("SUBSCRIPTION_PAUSED");
      }
    } catch {}
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (user && !submitting && !showSuccessAnimation) return <Navigate to="/" replace />;

  const isPaywallError = error?.includes("não encontrado ou pagamento não aprovado");
  const isPausedError = error === "SUBSCRIPTION_PAUSED";

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPaused(false);
    setSubmitting(true);
    try {
      sessionStorage.removeItem(PAUSED_NOTICE_KEY);
    } catch {}

    const { error } = await signIn(signinEmail, signinPassword);
    setSubmitting(false);

    if (error === "SUBSCRIPTION_PAUSED") {
      setPaused(true);
      setError("SUBSCRIPTION_PAUSED");
      try {
        sessionStorage.setItem(PAUSED_NOTICE_KEY, "1");
      } catch {}
      toast.error("Acesso suspenso", {
        description: PAUSED_MESSAGE,
      });
      return;
    }

    if (error) setError(error);
    else {
      try {
        sessionStorage.removeItem(PAUSED_NOTICE_KEY);
      } catch {}
      setShowSuccessAnimation(true);
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    setSubmitting(false);
    if (error) setError(error);
    else {
      setSuccess("Conta criada! Você já pode acessar a plataforma.");
      // Se já logou automaticamente, mostramos a animação
      if (user) setShowSuccessAnimation(true);
    }
  }

  async function handleFirstAccessCheck(e: FormEvent) {
    e.preventDefault();
    setFirstAccessResult(null);
    setFirstAccessChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-approved-email", {
        body: { email: firstAccessEmail },
      });
      if (error) throw error;
      if (data?.approved) {
        setFirstAccessResult({ ok: true });
        setSignupEmail(firstAccessEmail.trim().toLowerCase());
      } else {
        setFirstAccessResult({
          ok: false,
          msg: "E-mail ainda não aprovado. Verifique se é o mesmo da compra ou aguarde alguns minutos.",
        });
      }
    } catch (err: any) {
      setFirstAccessResult({
        ok: false,
        msg: "Não foi possível verificar agora. Tente novamente em instantes.",
      });
    } finally {
      setFirstAccessChecking(false);
    }
  }

  function goCreateAccount() {
    setTab("signup");
    setFirstAccessOpen(false);
    setFirstAccessResult(null);
    setError(null);
    setSuccess(null);
  }

  const handleAnimationComplete = () => {
    navigate("/", { replace: true });
  };

  return (
    <main className="fixed inset-0 flex items-center justify-center overflow-hidden px-4 bg-background">
      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} />
      {showSuccessAnimation && (
        <LoginSuccessAnimation onComplete={handleAnimationComplete} userName={user?.user_metadata?.display_name || signupName || null} />
      )}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-primary/20 blur-[120px] animate-float" />
        <div className="absolute -right-20 bottom-10 h-[28rem] w-[28rem] rounded-full bg-secondary/15 blur-[140px] animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute left-1/2 top-1/2 h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[100px] animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <div className="mb-4 text-center animate-fade-in" style={{ animationDuration: "0.7s" }}>
          <div className="relative mx-auto mb-2 flex items-center justify-center">
            <div className="absolute inset-0 -z-10 mx-auto h-32 w-32 rounded-full bg-primary/30 blur-3xl animate-pulse-glow" />
            <Logo3D size={140} spin />
          </div>
          <h1
            className="font-display text-2xl font-bold tracking-tight animate-fade-in"
            style={{ animationDelay: "0.25s", animationFillMode: "backwards" }}
          >
            <span className="gradient-text">Videomaker</span>{" "}
            <span className="text-foreground">Inteligente</span>
          </h1>
          <p
            className="mt-1 text-xs text-muted-foreground animate-fade-in"
            style={{ animationDelay: "0.4s", animationFillMode: "backwards" }}
          >
            Calculadora de Precificação
          </p>
        </div>

        <div
          className="glass rounded-2xl p-6 sm:p-7 animate-scale-in w-full shadow-2xl"
          style={{ animationDelay: "0.5s", animationFillMode: "backwards" }}
        >
          <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setError(null); setSuccess(null); }} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/40">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-4 space-y-3">
              {paused && (
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                  <AlertDescription className="text-sm">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                      <div className="flex-1 space-y-2">
                        <p className="font-semibold text-foreground text-sm">Acesso suspenso</p>
                        <p className="text-xs text-muted-foreground">
                          {PAUSED_MESSAGE}
                        </p>
                        <Button
                          onClick={() => setPricingOpen(true)}
                          className="mt-1 bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 h-auto"
                        >
                          Escolher plano <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSignIn} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="signin-email" className="text-xs">E-mail</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={signinEmail}
                    onChange={(e) => {
                      setSigninEmail(e.target.value);
                      if (paused) {
                        setPaused(false);
                        setError(null);
                        try {
                          sessionStorage.removeItem(PAUSED_NOTICE_KEY);
                        } catch {}
                      }
                    }}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signin-password" font-size="text-xs">Senha</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={signinPassword}
                    onChange={(e) => {
                      setSigninPassword(e.target.value);
                      if (paused) {
                        setPaused(false);
                        setError(null);
                        try {
                          sessionStorage.removeItem(PAUSED_NOTICE_KEY);
                        } catch {}
                      }
                    }}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
                </Button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/60" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-background/40 px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFirstAccessOpen((v) => !v);
                    setFirstAccessResult(null);
                    setError(null);
                  }}
                  className="w-full gap-2"
                >
                  <KeyRound className="h-4 w-4" />
                  {firstAccessOpen ? "Cancelar primeiro acesso" : "Primeiro acesso (Verificar sua Compra)"}
                </Button>

                {firstAccessOpen && (
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Digite o e-mail usado na compra. Vamos verificar se o pagamento foi aprovado.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="first-access-email" className="text-xs">E-mail da compra</Label>
                      <Input
                        id="first-access-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={firstAccessEmail}
                        onChange={(e) => setFirstAccessEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleFirstAccessCheck}
                      disabled={firstAccessChecking || !firstAccessEmail}
                      className="w-full"
                      size="sm"
                    >
                      {firstAccessChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar acesso"}
                    </Button>

                    {firstAccessResult?.ok && (
                      <Alert className="border-success/40 bg-success/10">
                        <AlertDescription className="text-sm">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                            <div className="flex-1">
                              <p className="font-medium text-foreground">Compra aprovada! 🎉</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Agora crie sua senha para acessar a plataforma.
                              </p>
                              <Button
                                type="button"
                                size="sm"
                                onClick={goCreateAccount}
                                className="mt-2 bg-gradient-primary text-primary-foreground hover:opacity-90"
                              >
                                Criar minha senha
                              </Button>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {firstAccessResult && firstAccessResult.ok === false && (
                      <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
                        <AlertDescription className="text-sm">
                          {(firstAccessResult as { ok: false; msg: string }).msg}
                          <Button
                            onClick={() => setPricingOpen(true)}
                            className="mt-2 bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 h-auto"
                          >
                            Adquirir <ExternalLink className="h-3 w-3" />
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6 space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Seu nome</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Como devemos te chamar"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                    maxLength={80}
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail (mesmo da compra)</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta"}
                </Button>

                <div className="mt-4 rounded-lg border border-[#22c55e]/30 bg-[#f0fdf4] p-3 text-center">
                  <p className="text-xs font-medium text-[#166534]">
                    🎉 7 dias grátis de acesso completo — Sem cartão necessário agora.
                  </p>
                  <p className="mt-1 text-[10px] text-[#166534]/80">
                    Após o teste: Mensal R$57/mês ou Anual R$399/ano (6x sem juros).
                  </p>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          {/* Aviso de erro inferior removido conforme solicitado */}


          {success && (
            <Alert className="mt-4 border-success/40 bg-success/10">
              <AlertDescription className="text-sm text-success-foreground">{success}</AlertDescription>
            </Alert>
          )}

          <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Seus dados são armazenados com segurança na nuvem. Acesso liberado apenas para compradores aprovados !
          </p>
        </div>
      </div>
    </main>
  );
}

