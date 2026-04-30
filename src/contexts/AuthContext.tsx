import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  accessStatus: "active" | "trial" | "trial_expired" | "blocked" | "loading" | null;
  trialDaysRemaining: number;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  checkAccess: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STRIPE_MENSAL_URL = "https://buy.stripe.com/dRm14ndVX25MbGJdru5ZC04";
const STRIPE_ANUAL_URL = "https://buy.stripe.com/9B65kDg456m26mp87a5ZC05";

export const STRIPE_MENSAL = STRIPE_MENSAL_URL;
export const STRIPE_ANUAL = STRIPE_ANUAL_URL;

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("email_not_approved") || m.includes("email não foi encontrado")) {
    return "E-mail não encontrado ou pagamento não aprovado. Certifique-se de usar o mesmo e-mail da compra.";
  }
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("user already registered")) return "Este e-mail já está cadastrado. Faça login.";
  if (m.includes("password should be at least")) return "A senha deve ter pelo menos 6 caracteres.";
  if (m.includes("email rate limit")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<AuthContextValue["accessStatus"]>("loading");
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);

  async function checkAccess() {
    if (!user) {
      setAccessStatus(null);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-approved-email", {
        body: { email: user.email },
      });

      if (error) throw error;

      if (data.approved) {
        if (data.status === "trial") {
          setAccessStatus("trial");
          setTrialDaysRemaining(data.trial_days_remaining || 0);
        } else {
          setAccessStatus("active");
        }
      } else {
        if (data.status === "trial_expired") {
          setAccessStatus("trial_expired");
        } else {
          setAccessStatus("blocked");
        }
      }
    } catch (err) {
      console.error("Error checking access:", err);
      // Fallback behavior if function fails - keep as loading or set to blocked?
      // Defaulting to blocked for security, but maybe allow if it's a temp network error.
    }
  }

  useEffect(() => {
    if (user) {
      checkAccess();
    } else if (!loading) {
      setAccessStatus(null);
    }
  }, [user, loading]);

  useEffect(() => {
    // IMPORTANT: set up listener FIRST, then check session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();
    const ADMIN = "rangelmaker@gmail.com";

    if (cleanEmail !== ADMIN) {
      try {
        const { data: approvedData } = await supabase.functions.invoke("check-approved-email", {
          body: { email: cleanEmail },
        });
        if (!approvedData?.approved) {
          return { error: "SUBSCRIPTION_PAUSED" };
        }
      } catch {
        // segue para a validação pós-login
      }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (error) return { error: friendlyAuthError(error.message) };

    if (cleanEmail !== ADMIN) {
      const { data: approved } = await supabase.rpc("is_email_approved", { _email: cleanEmail });
      if (!approved) {
        try { sessionStorage.setItem("vmi:pausedNotice", "1"); } catch {}
        await supabase.auth.signOut();
        return { error: "SUBSCRIPTION_PAUSED" };
      }
    }

    try { sessionStorage.setItem("vmi:justLoggedIn", "1"); } catch {}
    return { error: null };
  }

  async function signUp(email: string, password: string, displayName: string) {
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName },
      },
    });
    if (error) return { error: friendlyAuthError(error.message) };
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      accessStatus, 
      trialDaysRemaining, 
      signIn, 
      signUp, 
      signOut,
      checkAccess
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
