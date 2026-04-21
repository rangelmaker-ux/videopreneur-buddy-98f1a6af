import { useEffect, useState } from "react";
import { Logo3D } from "./Logo3D";

interface WelcomeOverlayProps {
  name?: string | null;
  onDone: () => void;
}

/**
 * Splash de boas-vindas exibido logo após o login.
 * Mostra o logo 3D + saudação e desaparece sozinho em ~2.6s.
 */
export function WelcomeOverlay({ name, onDone }: WelcomeOverlayProps) {
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase("out"), 2000);
    const t2 = window.setTimeout(() => onDone(), 2600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [onDone]);

  const greeting = name?.trim() ? `Olá, ${name.split(" ")[0]}` : "Bem-vindo";

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md transition-opacity duration-500 ${
        phase === "out" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden={phase === "out"}
    >
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[140px] animate-pulse-glow" />
        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-secondary/15 blur-[120px] animate-float" />
        <div
          className="absolute -right-20 bottom-10 h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-[140px] animate-float"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center animate-scale-in">
        <Logo3D size={220} spin />
        <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight animate-fade-in">
          <span className="gradient-text">{greeting}</span>
        </h2>
        <p
          className="mt-2 text-sm text-muted-foreground animate-fade-in"
          style={{ animationDelay: "0.2s", animationFillMode: "backwards" }}
        >
          Preparando sua plataforma…
        </p>

        {/* progress shimmer */}
        <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-muted/40">
          <div className="h-full w-1/3 rounded-full bg-gradient-primary animate-[slide-in-right_2s_ease-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
