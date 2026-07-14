import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        new Notification("Notificações Ativas", {
          body: "Você receberá lembretes dos seus compromissos 3h e 15 min antes.",
          icon: "/icon-192.png",
        });
      }
      return result;
    }
    return "default";
  }, []);

  // Check and schedule notifications
  useEffect(() => {
    if (!user || permission !== "granted") return;

    let activeTimeouts: NodeJS.Timeout[] = [];

    const schedule = async () => {
      // Clear previous timeouts
      activeTimeouts.forEach((t) => clearTimeout(t));
      activeTimeouts = [];

      try {
        const { data: deliveries, error } = await supabase
          .from("fixed_client_deliveries")
          .select("id, title, recording_at, status")
          .eq("status", "scheduled")
          .not("recording_at", "is", null);

        if (error || !deliveries) return;

        const now = Date.now();
        const shownKeys = JSON.parse(localStorage.getItem("vmi:shown_notifications") || "{}");

        deliveries.forEach((d) => {
          if (!d.recording_at) return;
          const eventTime = new Date(d.recording_at).getTime();

          const triggerTimes = [
            {
              type: "3h",
              time: eventTime - 3 * 60 * 60 * 1000,
              message: `Compromisso em 3 horas: "${d.title || "Sem título"}"`,
            },
            {
              type: "15m",
              time: eventTime - 15 * 60 * 1000,
              message: `Compromisso em 15 minutos: "${d.title || "Sem título"}"`,
            },
          ];

          triggerTimes.forEach(({ type, time, message }) => {
            const key = `${d.id}-${type}`;
            // If the trigger time is in the future and has not been shown yet
            if (time > now && !shownKeys[key]) {
              const delay = time - now;
              // Limit setTimeout delay to safe range (setTimeout max is ~24.8 days)
              if (delay < 2147483647) {
                const timeoutId = setTimeout(() => {
                  if (Notification.permission === "granted") {
                    new Notification("Lembrete de Compromisso", {
                      body: message,
                      icon: "/icon-192.png",
                      badge: "/favicon.png",
                    });
                    // Mark as shown
                    const currentShown = JSON.parse(localStorage.getItem("vmi:shown_notifications") || "{}");
                    currentShown[key] = true;
                    localStorage.setItem("vmi:shown_notifications", JSON.stringify(currentShown));
                  }
                }, delay);
                activeTimeouts.push(timeoutId);
              }
            }
          });
        });
      } catch (err) {
        console.error("Erro ao agendar notificações:", err);
      }
    };

    // Run scheduler immediately and then every 5 minutes
    void schedule();
    const interval = setInterval(schedule, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      activeTimeouts.forEach((t) => clearTimeout(t));
    };
  }, [user, permission]);

  // Helper to send a test notification immediately
  const sendTestNotification = useCallback(() => {
    if (Notification.permission === "granted") {
      new Notification("Lembrete de Teste", {
        body: "Esta é uma notificação de teste do Videopreneur Buddy!",
        icon: "/icon-192.png",
      });
      return true;
    }
    return false;
  }, []);

  return {
    permission,
    requestPermission,
    sendTestNotification,
  };
}
