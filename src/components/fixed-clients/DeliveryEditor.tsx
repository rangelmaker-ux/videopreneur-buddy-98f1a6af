import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Copy, Save, Trash2 } from "lucide-react";
import {
  Delivery,
  DeliveryStatus,
  FixedClient,
  QuoteClient,
  STATUS_META,
} from "@/hooks/useFixedClients";

type Mode =
  | { kind: "create"; defaults?: Partial<Delivery> }
  | { kind: "edit"; delivery: Delivery };

export type DeliveryEditorProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: Mode;
  clients: FixedClient[];
  quoteClients?: QuoteClient[];
  deliveries?: Delivery[]; // Added to allow group operations
  onSave: (
    payload: Partial<Delivery> & {
      fixed_client_id?: string | null;
      quote_id?: string | null;
    }
  ) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onDuplicate?: (id: string) => Promise<void>;
  onBulkSave?: (payloads: any[]) => Promise<void>; // Added for group operations
  onBulkDelete?: (ids: string[]) => Promise<void>; // Added for group operations
};

// Valor único do <Select> que codifica origem + id
// "fixed:<id>" ou "quote:<id>"
const FIXED_PREFIX = "fixed:";
const QUOTE_PREFIX = "quote:";

const STATUSES: DeliveryStatus[] = [
  "scheduled",
  "recorded",
  "editing",
  "delivered",
  "posted",
];

function toDateTimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromDateTimeLocal(v: string) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export default function DeliveryEditor({
  open,
  onOpenChange,
  mode,
  clients,
  quoteClients = [],
  deliveries = [],
  onSave,
  onDelete,
  onDuplicate,
  onBulkSave,
  onBulkDelete,
}: DeliveryEditorProps) {
  const initial =
    mode.kind === "edit" ? mode.delivery : (mode.defaults as Partial<Delivery>);

  const [clientId, setClientId] = useState(initial?.fixed_client_id || "");
  const [quoteId, setQuoteId] = useState<string | null>(
    initial?.quote_id || null
  );
  const [title, setTitle] = useState(initial?.title || "");
  const [recording, setRecording] = useState(
    toDateTimeLocal(initial?.recording_at || null)
  );
  const [deliveryDate, setDeliveryDate] = useState(
    initial?.delivery_date || ""
  );
  const [location, setLocation] = useState(initial?.location || "");
  const [script, setScript] = useState(initial?.script || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [status, setStatus] = useState<DeliveryStatus>(
    (initial?.status as DeliveryStatus) || "scheduled"
  );
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatGroup, setRepeatGroup] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset when opening with different data
  useEffect(() => {
    if (!open) return;
    const init =
      mode.kind === "edit"
        ? mode.delivery
        : (mode.defaults as Partial<Delivery>);
    const incomingQuote = init?.quote_id || null;
    const incomingFixed = init?.fixed_client_id || "";
    setQuoteId(incomingQuote);
    // Default: usa o que veio; se não veio nada, escolhe primeiro cliente fixo;
    // se não houver fixos mas houver de orçamento, usa o primeiro de orçamento.
    if (incomingFixed) {
      setClientId(incomingFixed);
    } else if (incomingQuote) {
      setClientId("");
    } else if (clients[0]) {
      setClientId(clients[0].id);
    } else if (quoteClients[0]) {
      setQuoteId(quoteClients[0].quote_id);
      setClientId("");
    } else {
      setClientId("");
    }
    setTitle(init?.title || "");
    setRecording(toDateTimeLocal(init?.recording_at || null));
    setDeliveryDate(init?.delivery_date || "");
    setLocation(init?.location || "");
    setScript(init?.script || "");
    setNotes(init?.notes || "");
    setStatus((init?.status as DeliveryStatus) || "scheduled");
    setRepeatWeekly(false);
    setRepeatGroup(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  const isEdit = mode.kind === "edit";
  // Quando estamos editando uma entrega vinda de orçamento, não permitimos
  // trocar a origem (a entrega já está vinculada ao quote_id existente).
  const lockedToQuote = isEdit && !!quoteId;

  // Valor combinado para o seletor de origem
  const sourceValue = clientId
    ? `${FIXED_PREFIX}${clientId}`
    : quoteId
    ? `${QUOTE_PREFIX}${quoteId}`
    : "";

  const handleSourceChange = (v: string) => {
    if (v.startsWith(FIXED_PREFIX)) {
      setClientId(v.slice(FIXED_PREFIX.length));
      setQuoteId(null);
    } else if (v.startsWith(QUOTE_PREFIX)) {
      setQuoteId(v.slice(QUOTE_PREFIX.length));
      setClientId("");
    }
  };

  const handleSave = async () => {
    if (!clientId && !quoteId) return;
    setSaving(true);
    
    const basePayload = {
      fixed_client_id: clientId || null,
      quote_id: quoteId,
      title: title.trim(),
      recording_at: fromDateTimeLocal(recording),
      delivery_date: deliveryDate || null,
      location: location.trim(),
      script,
      notes,
      status,
    };

    if (isEdit && repeatGroup && onBulkSave) {
      const current = (mode as { kind: "edit"; delivery: Delivery }).delivery;
      // Get similar future deliveries (same title prefix if it was generated with " (Semana N)")
      // or simply same original title
      const baseTitle = current.title.replace(/ \(Semana \d+\)$/, "");
      const futureDeliveries = deliveries.filter(d => 
        d.id !== current.id && 
        d.fixed_client_id === current.fixed_client_id &&
        d.title.startsWith(baseTitle) &&
        d.recording_at && current.recording_at &&
        new Date(d.recording_at) > new Date(current.recording_at)
      );

      if (futureDeliveries.length > 0) {
        const updates = futureDeliveries.map(d => ({
          id: d.id,
          patch: {
            ...basePayload,
            // Keep the specific date/time of each future delivery, 
            // unless the user specifically wanted to move the whole group (complex)
            // For now, let's keep their dates but update metadata
            recording_at: d.recording_at,
            delivery_date: d.delivery_date,
            title: d.title // Keep their specific title with "Semana X"
          }
        }));
        await onBulkSave(updates);
      }
    }

    if (repeatWeekly && !isEdit) {
      // ... keep existing repeat logic
      const baseDate = fromDateTimeLocal(recording);
      if (baseDate) {
        for (let i = 0; i < 4; i++) {
          const date = new Date(baseDate);
          date.setDate(date.getDate() + i * 7);
          
          const delDate = deliveryDate ? new Date(deliveryDate + "T12:00:00") : null;
          if (delDate) {
            delDate.setDate(delDate.getDate() + i * 7);
          }

          await onSave({
            ...basePayload,
            recording_at: date.toISOString(),
            delivery_date: delDate ? delDate.toISOString().split('T')[0] : null,
            title: i === 0 ? basePayload.title : `${basePayload.title} (Semana ${i + 1})`
          });
        }
      }
    } else {
      await onSave(basePayload);
    }

    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="font-display tracking-tight">
            {isEdit ? "Editar entrega" : "Nova entrega"}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {lockedToQuote ? (
            <Field label="Origem">
              <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground/90 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-warning" />
                Entrega de <strong>orçamento aprovado</strong>
                {(() => {
                  const q = quoteClients.find((x) => x.quote_id === quoteId);
                  return q ? ` · ${q.customer_name}` : "";
                })()}
              </div>
            </Field>
          ) : (
            <Field label="Cliente">
              <Select value={sourceValue} onValueChange={handleSourceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        Clientes fixos
                      </div>
                      {clients.map((c) => (
                        <SelectItem
                          key={c.id}
                          value={`${FIXED_PREFIX}${c.id}`}
                        >
                          {c.name} {!c.active && "(inativo)"}
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {quoteClients.length > 0 && (
                    <>
                      <div className="px-2 py-1 mt-1 text-[10px] uppercase tracking-wider text-muted-foreground border-t border-border">
                        Orçamentos aprovados
                      </div>
                      {quoteClients.map((q) => (
                        <SelectItem
                          key={q.quote_id}
                          value={`${QUOTE_PREFIX}${q.quote_id}`}
                        >
                          {q.customer_name}
                          {q.project_name ? ` · ${q.project_name}` : ""}
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {clients.length === 0 && quoteClients.length === 0 && (
                    <div className="px-2 py-2 text-xs text-muted-foreground">
                      Nenhum cliente disponível
                    </div>
                  )}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field label="Título do vídeo">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Reels semanal · institucional · review produto"
              maxLength={140}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Gravação (data + hora)">
              <div className="space-y-1">
                <Input
                  type="datetime-local"
                  value={recording}
                  onChange={(e) => setRecording(e.target.value)}
                />
                <p className="text-[9px] text-muted-foreground">
                  Atenção: certifique-se da data/hora antes de salvar.
                </p>
              </div>
            </Field>
            <Field label="Entrega (data)">
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </Field>
          </div>

          {!isEdit ? (
            <div className="flex flex-col gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="repeat-weekly"
                  checked={repeatWeekly}
                  onCheckedChange={(checked) => setRepeatWeekly(!!checked)}
                />
                <label
                  htmlFor="repeat-weekly"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Repetir essa data toda semana
                </label>
              </div>

              {repeatWeekly && (
                <Alert className="bg-amber-500/10 border-amber-500/20 py-2">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-[11px] text-warning-foreground leading-snug">
                    <strong>Atenção:</strong> Serão criados 4 agendamentos (um para cada semana). 
                    Lembre-se de abrir cada um posteriormente para preencher os detalhes específicos.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="repeat-group"
                  checked={repeatGroup}
                  onCheckedChange={(checked) => setRepeatGroup(!!checked)}
                />
                <label
                  htmlFor="repeat-group"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Aplicar alterações em todos os agendamentos futuros deste grupo
                </label>
              </div>
              
              {repeatGroup && (
                <Alert className="bg-amber-500/10 border-amber-500/20 py-2">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-[11px] text-warning-foreground leading-snug">
                    <strong>Atenção:</strong> Isso atualizará o roteiro, local e notas de todas as entregas futuras com o mesmo título base.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <Field label="Local de gravação">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Estúdio, endereço, link da call…"
              maxLength={200}
            />
          </Field>

          <Field label="Status">
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as DeliveryStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_META[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Roteiro / pauta">
            <Textarea
              rows={8}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Escreva o roteiro, ideias, blocos, falas, takes…"
              className="font-mono text-xs leading-relaxed resize-y min-h-[160px]"
            />
          </Field>

          <Field label="Observações">
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Equipamentos, referências, links…"
            />
          </Field>
        </div>

        <SheetFooter className="gap-2 flex-row flex-wrap sm:justify-between border-t border-border pt-4">
          <div className="flex gap-2">
            {isEdit && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir entrega?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        await onDelete((mode as any).delivery.id);
                        onOpenChange(false);
                      }}
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {isEdit && onDuplicate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDuplicate((mode as any).delivery.id)}
                title="Duplicar"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={(!clientId && !quoteId) || saving}
              className="bg-gradient-primary text-primary-foreground"
            >
              <Save className="h-4 w-4 mr-1.5" />
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
