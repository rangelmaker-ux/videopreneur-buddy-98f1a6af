import { useState } from "react";
import {
  Delivery,
  FixedClient,
  QuoteClient,
  useFixedClients,
} from "@/hooks/useFixedClients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  Sparkles,
} from "lucide-react";
import { brl } from "@/lib/pricing";
import { clientColor } from "@/lib/clientColors";
import DeliveryCard from "./DeliveryCard";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default function ClientsView({
  clients,
  hook,
  onCreateDelivery,
  onOpenDelivery,
}: {
  clients: FixedClient[];
  hook: ReturnType<typeof useFixedClients>;
  onCreateDelivery: (clientId: string) => void;
  onOpenDelivery: (delivery: Delivery) => void;
}) {
  const { createClient, updateClient, removeClient, cycleMonth, cycleYear } =
    hook;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contact: "",
    notes: "",
    videos_per_month: 4,
    monthly_value: 0,
    renewal_day: 1,
  });

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await createClient(form);
    setForm({
      name: "",
      contact: "",
      notes: "",
      videos_per_month: 4,
      monthly_value: 0,
      renewal_day: 1,
    });
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">
          Ciclo atual:{" "}
          <span className="font-medium text-foreground">
            {MONTHS[cycleMonth - 1]} {cycleYear}
          </span>
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-gradient-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-1" /> Novo cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo cliente fixo</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <FormField label="Nome / Empresa">
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={120}
                />
              </FormField>
              <FormField label="Contato (telefone, e-mail)">
                <Input
                  value={form.contact}
                  onChange={(e) =>
                    setForm({ ...form, contact: e.target.value })
                  }
                  maxLength={120}
                />
              </FormField>
              <div className="grid grid-cols-3 gap-3">
                <FormField label="Vídeos/mês">
                  <Input
                    type="number"
                    min={0}
                    value={form.videos_per_month}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        videos_per_month: parseInt(e.target.value || "0"),
                      })
                    }
                  />
                </FormField>
                <FormField label="Valor mensal">
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.monthly_value}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        monthly_value: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                </FormField>
                <FormField label="Dia renovação">
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    value={form.renewal_day}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        renewal_day: Math.max(
                          1,
                          Math.min(28, parseInt(e.target.value || "1"))
                        ),
                      })
                    }
                  />
                </FormField>
              </div>
              <FormField label="Notas">
                <Textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  maxLength={500}
                />
              </FormField>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                className="bg-gradient-primary text-primary-foreground"
              >
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {clients.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center space-y-2">
          <Users className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum cliente fixo cadastrado.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {clients.map((c) => (
            <ClientCard
              key={c.id}
              client={c}
              hook={hook}
              onUpdate={(p) => updateClient(c.id, p)}
              onDelete={() => removeClient(c.id)}
              onCreateDelivery={() => onCreateDelivery(c.id)}
              onOpenDelivery={onOpenDelivery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClientCard({
  client,
  hook,
  onUpdate,
  onDelete,
  onCreateDelivery,
  onOpenDelivery,
}: {
  client: FixedClient;
  hook: ReturnType<typeof useFixedClients>;
  onUpdate: (p: Partial<FixedClient>) => void;
  onDelete: () => void;
  onCreateDelivery: () => void;
  onOpenDelivery: (d: Delivery) => void;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });

  const items = hook.deliveriesInCycle(client.id, cursor.year, cursor.month);
  const delivered = hook.countDeliveredInCycle(
    client.id,
    cursor.year,
    cursor.month
  );
  const remaining = Math.max(0, client.videos_per_month - delivered);
  const pct =
    client.videos_per_month > 0
      ? Math.min(100, (delivered / client.videos_per_month) * 100)
      : 0;
  const color = clientColor(client.id);

  const prev = () =>
    setCursor((c) =>
      c.month === 1
        ? { year: c.year - 1, month: 12 }
        : { year: c.year, month: c.month - 1 }
    );
  const next = () =>
    setCursor((c) =>
      c.month === 12
        ? { year: c.year + 1, month: 1 }
        : { year: c.year, month: c.month + 1 }
    );

  return (
    <article
      className="glass rounded-xl p-4 space-y-3 border-l-4"
      style={{ borderLeftColor: color.dot }}
    >
      <header className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-semibold text-base truncate">
              {client.name}
            </p>
            {!client.active && (
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Inativo
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {client.contact || "Sem contato cadastrado"}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display text-base font-bold tabular-nums">
            {brl(client.monthly_value)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            renova dia {client.renewal_day}
          </p>
        </div>
      </header>

      {/* Seletor de ciclo */}
      <div className="flex items-center justify-between rounded-lg bg-muted/30 px-2 py-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={prev}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <p className="text-xs font-medium">
          {MONTHS[cursor.month - 1]} {cursor.year}
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={next}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Entregues no ciclo</span>
          <span className="font-medium tabular-nums">
            {delivered} / {client.videos_per_month}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {remaining > 0
            ? `${remaining} restante(s) para fechar o pacote`
            : "Pacote concluído ✓"}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={onCreateDelivery}>
          <CalendarPlus className="h-3.5 w-3.5 mr-1" /> Nova entrega
        </Button>
        {client.videos_per_month > 0 && items.length < client.videos_per_month && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              hook.generateMonthSlots(client.id, cursor.year, cursor.month)
            }
            title="Gera os slots faltantes para o ciclo"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Gerar {client.videos_per_month - items.length} vídeo(s)
          </Button>
        )}
        <div className="flex items-center gap-1.5 text-xs ml-auto">
          <span className="text-muted-foreground">Ativo</span>
          <Switch
            checked={client.active}
            onCheckedChange={(v) => onUpdate({ active: v })}
          />
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir “{client.name}”?</AlertDialogTitle>
              <AlertDialogDescription>
                Todas as entregas registradas também serão removidas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Entregas do ciclo */}
      <div className="pt-2 border-t border-border/60 space-y-2">
        {client.notes && (
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
            {client.notes}
          </p>
        )}
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((d) => (
              <DeliveryCard
                key={d.id}
                delivery={d}
                client={client}
                onClick={() => onOpenDelivery(d)}
                onToggleDelivered={() => hook.markDelivered(d.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground italic py-1">
            Nenhuma entrega neste ciclo.
          </p>
        )}
      </div>
    </article>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
