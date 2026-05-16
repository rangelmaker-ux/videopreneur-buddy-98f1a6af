import { useMemo, useState, useEffect } from "react";
import { useQuotes } from "@/hooks/useQuotes";
import { useVideoConfigs } from "@/contexts/VideoConfigsContext";
import { Quote, QuoteStatus, STATUS_BADGE, STATUS_LABEL } from "@/lib/quotes";
import { brl } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Search, FileText, Trash2, Download, Share2, Pencil } from "lucide-react";
import { downloadQuotePdf, shareQuoteOnWhatsapp } from "@/lib/quotePdf";

export default function QuotesTab() {
  const { quotes, loading, setStatus, removeQuote, updateQuote } = useQuotes();
  const { professional } = useVideoConfigs();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<QuoteStatus | "all">("all");
  const [detail, setDetail] = useState<Quote | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleStorage = () => setTick(t => t + 1);
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return quotes.filter((q) => {
      if (filter !== "all" && q.status !== filter) return false;
      if (!term) return true;
      return (q.customer_name + " " + q.project_name).toLowerCase().includes(term);
    });
  }, [quotes, search, filter]);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por cliente ou projeto" className="pl-9" />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="sent">Enviado</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center space-y-2">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum orçamento encontrado.</p>
          <p className="text-xs text-muted-foreground">Crie um na aba Calculadora.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((q) => (
            <article key={q.id} className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                onClick={() => setDetail(q)}
                className="flex-1 text-left min-w-0"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_BADGE[q.status]}`}>
                    {STATUS_LABEL[q.status]}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{new Date(q.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <p className="font-display font-semibold text-base mt-1 truncate">{q.project_name}</p>
                <p className="text-xs text-muted-foreground truncate">{q.customer_name} • {q.video_type_label}</p>
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <p className="font-display text-lg font-bold gradient-text tabular-nums">{brl(q.total)}</p>
                <Select value={q.status} onValueChange={(v) => setStatus(q.id, v as QuoteStatus)}>
                  <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="sent">Enviado</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                  </SelectContent>
                </Select>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeQuote(q.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <span>{detail.project_name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_BADGE[detail.status]}`}>
                    {STATUS_LABEL[detail.status]}
                  </span>
                </DialogTitle>
                <DialogDescription>{detail.customer_name} • {detail.video_type_label}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <Field label="Duração" value={`${detail.dur_minutes} min ${detail.dur_seconds ? detail.dur_seconds + "s" : ""}`} />
                <Field label="Locações" value={String(detail.locations)} />
                <Field label="Edição" value={detail.editing_level === "advanced" ? "Avançada" : detail.editing_level === "intermediate" ? "Intermediária" : "Básica"} />
                {detail.notes && <div><p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Notas</p><p className="text-sm whitespace-pre-wrap">{detail.notes}</p></div>}
                <div className="pt-2 border-t border-border">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</p>
                  <p className="font-display text-3xl font-bold gradient-text">{brl(detail.total)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={() => downloadQuotePdf(detail, professional)} className="flex-1 bg-gradient-primary text-primary-foreground">
                  <Download className="h-4 w-4 mr-1" /> PDF
                </Button>
                <Button onClick={() => shareQuoteOnWhatsapp(detail, professional)} variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 mr-1" /> WhatsApp
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
