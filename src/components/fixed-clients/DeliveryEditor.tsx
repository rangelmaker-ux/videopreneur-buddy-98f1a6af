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
import { Copy, Save, Trash2 } from "lucide-react";
import {
  Delivery,
  DeliveryStatus,
  FixedClient,
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
  onSave: (
    payload: Partial<Delivery> & {
      fixed_client_id?: string | null;
      quote_id?: string | null;
    }
  ) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onDuplicate?: (id: string) => Promise<void>;
};

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
  onSave,
  onDelete,
  onDuplicate,
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
  const [saving, setSaving] = useState(false);

  // Reset when opening with different data
  useEffect(() => {
    if (!open) return;
    const init =
      mode.kind === "edit"
        ? mode.delivery
        : (mode.defaults as Partial<Delivery>);
    const incomingQuote = init?.quote_id || null;
    setQuoteId(incomingQuote);
    setClientId(
      init?.fixed_client_id || (incomingQuote ? "" : clients[0]?.id || "")
    );
    setTitle(init?.title || "");
    setRecording(toDateTimeLocal(init?.recording_at || null));
    setDeliveryDate(init?.delivery_date || "");
    setLocation(init?.location || "");
    setScript(init?.script || "");
    setNotes(init?.notes || "");
    setStatus((init?.status as DeliveryStatus) || "scheduled");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  const isQuoteSourced = !!quoteId && !clientId;

  const handleSave = async () => {
    if (!clientId && !quoteId) return;
    setSaving(true);
    await onSave({
      fixed_client_id: clientId || null,
      quote_id: quoteId,
      title: title.trim(),
      recording_at: fromDateTimeLocal(recording),
      delivery_date: deliveryDate || null,
      location: location.trim(),
      script,
      notes,
      status,
    });
    setSaving(false);
    onOpenChange(false);
  };

  const isEdit = mode.kind === "edit";

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
          {isQuoteSourced ? (
            <Field label="Origem">
              <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground/90 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-warning" />
                Entrega gerada a partir de um <strong>orçamento aprovado</strong>.
              </div>
            </Field>
          ) : (
            <Field label="Cliente fixo">
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {!c.active && "(inativo)"}
                    </SelectItem>
                  ))}
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
              <Input
                type="datetime-local"
                value={recording}
                onChange={(e) => setRecording(e.target.value)}
              />
            </Field>
            <Field label="Entrega (data)">
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </Field>
          </div>

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
              disabled={!clientId || saving}
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
