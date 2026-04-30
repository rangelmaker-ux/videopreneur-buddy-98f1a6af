import { useEffect, useState, FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth, STRIPE_MENSAL } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ExternalLink, ShieldCheck, KeyRound, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo3D } from "@/components/Logo3D";

const PAUSED_MESSAGE = "Sua assinatura está em atraso ou foi pausada. Para continuar usando a plataforma, regularize seu pagamento. O acesso é liberado automaticamente após a confirmação.";
const PAUSED_NOTICE_KEY = "vmi:pausedNotice";

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
  if (user && !submitting) return <Navigate to="/" replace />;

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
      navigate("/", { replace: true });
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    setSubmitting(false);
    if (error) setError(error);
    else setSuccess("Conta criada! Você já pode acessar a plataforma.");
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
...
                      Digite o e-mail usado na compra. Vamos verificar se o pagamento foi aprovado.
...
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

          {error && (
            <Alert variant="destructive" className="mt-4 border-destructive/40 bg-destructive/10">
              <AlertDescription className="text-sm">
                {isPausedError
                  ? (
                    <>
                      <span className="font-semibold text-foreground">Acesso suspenso.</span>{" "}
                      <span>{PAUSED_MESSAGE}</span>
                    </>
                  )
                  : error}
                {(isPaywallError || isPausedError) && (
                  <a
                    href={STRIPE_MENSAL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                  >
                    {isPausedError ? "Regularizar pagamento" : "Adquirir"} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </AlertDescription>
            </Alert>
          )}

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

