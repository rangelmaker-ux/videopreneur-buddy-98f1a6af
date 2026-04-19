import { useState } from "react";
import { useFixedClients, FixedClient } from "@/hooks/useFixedClients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, Users, Check, X, Calendar } from "lucide-react";
import { brl } from "@/lib/pricing";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export default function FixedClientsTab() {
  const { clients, loading, createClient, updateClient, removeClient, addDelivery, removeDelivery, deliveries, countForClient, cycleMonth, cycleYear } = useFixedClients();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", notes: "", videos_per_month: 4, monthly_value: 0, renewal_day: 1 });

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await createClient(form);
    setForm({ name: "", contact: "", notes: "", videos_per_month: 4, monthly_value: 0, renewal_day: 1 });
    setOpen(false);
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="glass rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <p className="text-sm text-muted-foreground">Ciclo atual: <span className="font-medium text-foreground">{MONTHS[cycleMonth - 1]} {cycleYear}</span></p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Novo cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo cliente fixo</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <FormField label="Nome / Empresa">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} />
              </FormField>
              <FormField label="Contato (telefone, e-mail)">
                <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} maxLength={120} />
              </FormField>
              <div className="grid grid-cols-3 gap-3">
                <FormField label="Vídeos/mês">
                  <Input type="number" min={0} value={form.videos_per_month} onChange={(e) => setForm({ ...form, videos_per_month: parseInt(e.target.value || "0") })} />
                </FormField>
                <FormField label="Valor mensal">
                  <Input type="number" min={0} step={0.01} value={form.monthly_value} onChange={(e) => setForm({ ...form, monthly_value: parseFloat(e.target.value || "0") })} />
                </FormField>
                <FormField label="Dia renovação">
                  <Input type="number" min={1} max={28} value={form.renewal_day} onChange={(e) => setForm({ ...form, renewal_day: Math.max(1, Math.min(28, parseInt(e.target.value || "1"))) })} />
                </FormField>
              </div>
              <FormField label="Notas">
                <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={500} />
              </FormField>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} className="bg-gradient-primary text-primary-foreground">Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {clients.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center space-y-2">
          <Users className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum cliente fixo cadastrado.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {clients.map((c) => (
            <ClientCard
              key={c.id}
              client={c}
              delivered={countForClient(c.id)}
              deliveriesOfClient={deliveries.filter((d) => d.fixed_client_id === c.id)}
              onUpdate={(p) => updateClient(c.id, p)}
              onDelete={() => removeClient(c.id)}
              onAddDelivery={() => addDelivery(c.id)}
              onRemoveDelivery={(did) => removeDelivery(did)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClientCard({ client, delivered, deliveriesOfClient, onUpdate, onDelete, onAddDelivery, onRemoveDelivery }: {
  client: FixedClient;
  delivered: number;
  deliveriesOfClient: { id: string; title: string; delivered_at: string }[];
  onUpdate: (p: Partial<FixedClient>) => void;
  onDelete: () => void;
  onAddDelivery: () => void;
  onRemoveDelivery: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const remaining = Math.max(0, client.videos_per_month - delivered);
  const pct = client.videos_per_month > 0 ? Math.min(100, (delivered / client.videos_per_month) * 100) : 0;

  return (
    <article className="glass rounded-xl p-4 space-y-3">
      <header className="flex items-start gap-3">
        <button onClick={() => setExpanded((v) => !v)} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-semibold text-base truncate">{client.name}</p>
            {!client.active && <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inativo</span>}
          </div>
          <p className="text-xs text-muted-foreground truncate">{client.contact || "Sem contato cadastrado"}</p>
        </button>
        <div className="text-right shrink-0">
          <p className="font-display text-base font-bold tabular-nums">{brl(client.monthly_value)}</p>
          <p className="text-[11px] text-muted-foreground">renova dia {client.renewal_day}</p>
        </div>
      </header>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Entregas do mês</span>
          <span className="font-medium tabular-nums">{delivered} / {client.videos_per_month}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-gradient-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[11px] text-muted-foreground">{remaining > 0 ? `${remaining} restante(s)` : "Pacote concluído ✓"}</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={onAddDelivery}>
          <Check className="h-3.5 w-3.5 mr-1" /> Registrar entrega
        </Button>
        <div className="flex items-center gap-1.5 text-xs ml-auto">
          <span className="text-muted-foreground">Ativo</span>
          <Switch checked={client.active} onCheckedChange={(v) => onUpdate({ active: v })} />
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir “{client.name}”?</AlertDialogTitle>
              <AlertDialogDescription>Todas as entregas registradas também serão removidas.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {expanded && (
        <div className="pt-2 border-t border-border space-y-2">
          {client.notes && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{client.notes}</p>}
          {deliveriesOfClient.length > 0 ? (
            <ul className="space-y-1">
              {deliveriesOfClient.map((d) => (
                <li key={d.id} className="flex items-center justify-between text-xs gap-2 rounded-md bg-muted/40 px-2.5 py-1.5">
                  <span className="truncate">✓ Entrega em {new Date(d.delivered_at).toLocaleDateString("pt-BR")}</span>
                  <button onClick={() => onRemoveDelivery(d.id)} className="text-muted-foreground hover:text-destructive" aria-label="Remover entrega">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-muted-foreground">Nenhuma entrega registrada neste ciclo.</p>
          )}
        </div>
      )}
    </article>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
