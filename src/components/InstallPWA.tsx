import { useEffect, useState } from "react";
import { Download, Share, Plus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    
    setIsIOS(ios);
    setIsStandalone(standalone);

    // If it's iOS and not already installed, show install instruction
    if (ios && !standalone) {
      setVisible(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === "accepted") {
          console.log("Usuário aceitou a instalação");
          setVisible(false);
        }
        setDeferredPrompt(null);
      });
    } else {
      // Fallback: explain general install instructions
      setShowIOSModal(true);
    }
  };

  if (!visible || isStandalone) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleInstallClick}
        className="h-9 gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/5 transition-all rounded-full px-3 border border-primary/20 bg-primary/5"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Instalar App</span>
      </Button>

      <Dialog open={showIOSModal} onOpenChange={setShowIOSModal}>
        <DialogContent className="max-w-xs sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <Smartphone className="h-5 w-5 text-primary" />
              Instalar no iPhone (iOS)
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Adicione o aplicativo à sua tela de início para abrir em tela cheia e ter acesso completo offline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-sm">
            <div className="flex items-start gap-3 bg-muted/30 p-3 rounded-xl border border-border/40">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                1
              </span>
              <p className="text-xs leading-relaxed text-foreground/80">
                Toque no ícone de <strong>Compartilhar</strong> no menu inferior do Safari (o quadrado com uma seta apontando para cima <Share className="inline-block h-3.5 w-3.5 mx-0.5 text-primary" />).
              </p>
            </div>

            <div className="flex items-start gap-3 bg-muted/30 p-3 rounded-xl border border-border/40">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                2
              </span>
              <p className="text-xs leading-relaxed text-foreground/80">
                Role o menu de compartilhamento para baixo e toque em <strong>Adicionar à Tela de Início</strong> (ícone com o símbolo de mais <Plus className="inline-block h-3.5 w-3.5 mx-0.5 text-primary" />).
              </p>
            </div>

            <div className="flex items-start gap-3 bg-muted/30 p-3 rounded-xl border border-border/40">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                3
              </span>
              <p className="text-xs leading-relaxed text-foreground/80">
                Toque em <strong>Adicionar</strong> no canto superior direito para confirmar a instalação.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => setShowIOSModal(false)}
              className="w-full sm:w-auto bg-gradient-primary text-primary-foreground rounded-xl"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
