import { Cloud, CloudOff, Loader2, CheckCircle2 } from "lucide-react";
import { SyncStatus } from "@/contexts/VideoConfigsContext";
import { cn } from "@/lib/utils";

export function SyncBadge({ status }: { status: SyncStatus }) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium text-muted-foreground/70">
        <Loader2 className="h-3 w-3 animate-spin" /> 
        Sincronizando
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium text-destructive/80">
        <CloudOff className="h-3 w-3" /> 
        Erro
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium text-emerald-500/80">
        <CheckCircle2 className="h-3 w-3" /> 
        Salvo
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium text-muted-foreground/60")}>
      <Cloud className="h-3 w-3" /> 
      Nuvem
    </span>
  );
}
