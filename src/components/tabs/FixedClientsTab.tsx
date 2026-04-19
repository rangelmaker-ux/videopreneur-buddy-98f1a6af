import { useState } from "react";
import { useFixedClients, Delivery } from "@/hooks/useFixedClients";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, CalendarDays, Users } from "lucide-react";
import CalendarView from "@/components/fixed-clients/CalendarView";
import ClientsView from "@/components/fixed-clients/ClientsView";
import DeliveryEditor from "@/components/fixed-clients/DeliveryEditor";

export default function FixedClientsTab() {
  const hook = useFixedClients();
  const { clients, quoteClients, deliveries, loading, createDelivery, updateDelivery, removeDelivery, duplicateDelivery } = hook;

  const [view, setView] = useState<"calendar" | "clients">("calendar");
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
        onSave={handleSave}
        onDelete={removeDelivery}
        onDuplicate={duplicateDelivery}
      />
    </div>
  );
}
