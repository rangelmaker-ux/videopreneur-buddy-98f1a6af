import { Cloud, CloudOff, Loader2, Check } from "lucide-react";
import { SyncStatus } from "@/contexts/VideoConfigsContext";
import { cn } from "@/lib/utils";

export function SyncBadge({ status }: { status: SyncStatus }) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Sincronizando…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-destructive">
        <CloudOff className="h-3 w-3" /> Não salvo
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-success">
        <Check className="h-3 w-3" /> Salvo
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] text-muted-foreground")}>
      <Cloud className="h-3 w-3 text-success" /> Salvo na nuvem
    </span>
  );
}
