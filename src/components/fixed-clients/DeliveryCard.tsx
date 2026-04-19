import { useState } from "react";
import {
  Delivery,
  FixedClient,
  STATUS_META,
} from "@/hooks/useFixedClients";
import { clientColor } from "@/lib/clientColors";
import {
  ChevronDown,
  Clock,
  MapPin,
  CalendarCheck,
  FileText,
  Check,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TONE_CLASSES: Record<string, string> = {
  muted: "bg-muted/60 text-muted-foreground border-border",
  warning: "bg-warning/15 text-warning border-warning/30",
  accent: "bg-accent/15 text-accent border-accent/30",
  success: "bg-success/15 text-success border-success/30",
  primary: "bg-primary/15 text-primary border-primary/30",
};

function fmtDateTime(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(s: string | null) {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function DeliveryCard({
  delivery,
  client,
  onClick,
  onToggleDelivered,
}: {
  delivery: Delivery;
  client?: FixedClient;
  onClick: () => void;
  onToggleDelivered?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const color = client ? clientColor(client.id) : null;
  const meta = STATUS_META[delivery.status];
  const recording = fmtDateTime(delivery.recording_at);
  const delivery_d = fmtDate(delivery.delivery_date);
  const isDone = delivery.status === "delivered" || delivery.status === "posted";

  return (
    <article
      className="rounded-xl border bg-card/40 backdrop-blur-sm overflow-hidden transition-colors"
      style={
        color
          ? { borderColor: color.border }
          : undefined
      }
    >
      <header className="flex items-start gap-3 p-3">
        {color && (
          <span
            className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0"
            style={{ background: color.dot }}
            aria-hidden
          />
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 text-left min-w-0"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${TONE_CLASSES[meta.tone]}`}
            >
              {meta.label}
            </span>
            {client && (
              <span className="text-[11px] text-muted-foreground truncate">
                {client.name}
              </span>
            )}
          </div>
          <p className="font-medium text-sm mt-1 truncate">
            {delivery.title || (
              <span className="text-muted-foreground italic">Sem título</span>
            )}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-muted-foreground">
            {recording && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> Grav. {recording}
              </span>
            )}
            {delivery_d && (
              <span className="inline-flex items-center gap-1">
                <CalendarCheck className="h-3 w-3" /> Entrega {delivery_d}
              </span>
            )}
            {delivery.location && (
              <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                <MapPin className="h-3 w-3" /> {delivery.location}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-muted-foreground hover:text-foreground p-1"
          aria-label="Expandir"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </header>

      {open && (
        <div className="border-t border-border/60 p-3 space-y-3">
          {delivery.script ? (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 inline-flex items-center gap-1">
                <FileText className="h-3 w-3" /> Roteiro
              </p>
              <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed text-foreground/90 bg-muted/30 rounded-md p-2.5 max-h-60 overflow-auto">
                {delivery.script}
              </pre>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Sem roteiro escrito ainda.
            </p>
          )}
          {delivery.notes && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Observações
              </p>
              <p className="text-xs text-foreground/80 whitespace-pre-wrap">
                {delivery.notes}
              </p>
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={onClick}
              className="text-xs text-primary hover:underline"
            >
              Editar entrega →
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
