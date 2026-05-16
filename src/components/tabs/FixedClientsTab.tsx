import { useState, useEffect } from "react";
import { useFixedClients, Delivery } from "@/hooks/useFixedClients";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, CalendarDays, Users } from "lucide-react";
import { toast } from "sonner";
import CalendarView from "@/components/fixed-clients/CalendarView";
import ClientsView from "@/components/fixed-clients/ClientsView";
import DeliveryEditor from "@/components/fixed-clients/DeliveryEditor";

export default function FixedClientsTab() {
  const hook = useFixedClients();
  const { clients, quoteClients, deliveries, loading, createDelivery, updateDelivery, removeDelivery, duplicateDelivery, reload } = hook;

  const bulkSave = async (updates: { id: string; patch: any }[]) => {
    try {
      await Promise.all(updates.map(u => updateDelivery(u.id, u.patch)));
      toast.success(`${updates.length} agendamentos atualizados`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar agendamentos em massa");
    }
  };

  const bulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => removeDelivery(id)));
      toast.success(`${ids.length} agendamentos removidos`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao remover agendamentos em massa");
    }
  };

  const [view, setView] = useState<"calendar" | "clients">("calendar");
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleStorage = () => setTick(t => t + 1);
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<
    | { kind: "create"; defaults?: Partial<Delivery> }
    | { kind: "edit"; delivery: Delivery }
  >({ kind: "create" });

  const openCreate = (defaults?: Partial<Delivery>) => {
    setEditorMode({ kind: "create", defaults });
    setEditorOpen(true);
  };
  const openEdit = (delivery: Delivery) => {
    setEditorMode({ kind: "edit", delivery });
    setEditorOpen(true);
  };

  const handleSave = async (
    payload: Partial<Delivery> & {
      fixed_client_id?: string | null;
      quote_id?: string | null;
    }
  ) => {
    if (editorMode.kind === "edit") {
      await updateDelivery(editorMode.delivery.id, payload);
    } else {
      await createDelivery(payload as any);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-4 animate-fade-in">
      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList className="bg-muted/40">
          <TabsTrigger value="calendar" className="text-xs gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" /> Agenda
          </TabsTrigger>
          <TabsTrigger value="clients" className="text-xs gap-1.5">
            <Users className="h-3.5 w-3.5" /> Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <CalendarView
            clients={clients}
            deliveries={deliveries}
            onCreateAt={(defaults) => openCreate(defaults)}
            onOpenDelivery={openEdit}
          />
        </TabsContent>

        <TabsContent value="clients" className="mt-4">
          <ClientsView
            clients={clients}
            hook={hook}
            onCreateDelivery={(clientId) =>
              openCreate({ fixed_client_id: clientId })
            }
            onOpenDelivery={openEdit}
          />
        </TabsContent>
      </Tabs>

      <DeliveryEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        mode={editorMode}
        clients={clients}
        quoteClients={quoteClients}
        deliveries={deliveries}
        onSave={handleSave}
        onDelete={removeDelivery}
        onDuplicate={duplicateDelivery}
        onBulkSave={bulkSave}
        onBulkDelete={bulkDelete}
      />
    </div>
  );
}
