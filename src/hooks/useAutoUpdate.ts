import { useEffect } from "react";

export function useAutoUpdate() {
  useEffect(() => {
    // Registra o Service Worker e gerencia atualizações
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Tenta atualizar o Service Worker
        registration.update();

        // Verifica atualizações periodicamente (a cada 5 minutos)
        const interval = setInterval(() => {
          registration.update();
        }, 1000 * 60 * 5);

        return () => clearInterval(interval);
      });

      // Quando um novo Service Worker é encontrado e instalado
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // Recarrega a página para aplicar a nova versão imediatamente
        window.location.reload();
      });
    }

    // Fallback: Verificar versão via visibilidade da página
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.ready.then((reg) => reg.update());
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);
}
