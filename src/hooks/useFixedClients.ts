import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type FixedClient = {
  id: string;
  user_id: string;
  name: string;
  contact: string;
  notes: string;
  videos_per_month: number;
  monthly_value: number;
  renewal_day: number;
  active: boolean;
  created_at: string;
};

export type DeliveryStatus =
  | "scheduled"
  | "recorded"
  | "editing"
  | "delivered"
  | "posted";

export type Delivery = {
  id: string;
  fixed_client_id: string;
  user_id: string;
  title: string;
  script: string;
  location: string;
  notes: string;
  status: DeliveryStatus;
  recording_at: string | null;
  delivery_date: string | null;
  delivered_at: string | null;
  cycle_year: number;
  cycle_month: number;
  created_at: string;
};

export type DeliveryInput = Partial<
  Omit<Delivery, "id" | "user_id" | "created_at" | "cycle_year" | "cycle_month">
> & {
  fixed_client_id: string;
};

export const STATUS_META: Record<
  DeliveryStatus,
  { label: string; tone: string; order: number }
> = {
  scheduled: { label: "Agendado", tone: "muted", order: 1 },
  recorded: { label: "Gravado", tone: "warning", order: 2 },
  editing: { label: "Editando", tone: "accent", order: 3 },
  delivered: { label: "Entregue", tone: "success", order: 4 },
  posted: { label: "Postado", tone: "primary", order: 5 },
};

const DELIVERED_STATUSES: DeliveryStatus[] = ["delivered", "posted"];

export function useFixedClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<FixedClient[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const cy = now.getFullYear();
  const cm = now.getMonth() + 1;

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: cs }, { data: ds }] = await Promise.all([
      supabase
        .from("fixed_clients")
        .select("*")
        .order("created_at", { ascending: false }),
      // Carrega TODAS as entregas do usuário — necessário para o calendário global.
      supabase
        .from("fixed_client_deliveries")
        .select("*")
        .order("recording_at", { ascending: true, nullsFirst: false }),
    ]);
    setClients(((cs as any[]) || []).map(normalizeClient));
    setDeliveries(((ds as any[]) || []).map(normalizeDelivery));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const createClient = useCallback(
    async (payload: Partial<FixedClient> & { name: string }) => {
      if (!user) return;
      const { data, error } = await supabase
        .from("fixed_clients")
        .insert({
          user_id: user.id,
          name: payload.name,
          contact: payload.contact || "",
          notes: payload.notes || "",
          videos_per_month: payload.videos_per_month ?? 1,
          monthly_value: payload.monthly_value ?? 0,
          renewal_day: payload.renewal_day ?? 1,
          active: payload.active ?? true,
        })
        .select()
        .single();
      if (error || !data) {
        console.error(error);
        toast.error("Erro ao salvar cliente");
        return;
      }
      setClients((p) => [normalizeClient(data), ...p]);
      toast.success("Cliente fixo criado");
    },
    [user]
  );

  const updateClient = useCallback(
    async (id: string, patch: Partial<FixedClient>) => {
      const { data, error } = await supabase
        .from("fixed_clients")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error || !data) {
        console.error(error);
        toast.error("Erro ao atualizar");
        return;
      }
      setClients((p) => p.map((c) => (c.id === id ? normalizeClient(data) : c)));
    },
    []
  );

  const removeClient = useCallback(async (id: string) => {
    const { error } = await supabase.from("fixed_clients").delete().eq("id", id);
    if (error) {
      console.error(error);
      toast.error("Erro ao excluir");
      return;
    }
    setClients((p) => p.filter((c) => c.id !== id));
    setDeliveries((p) => p.filter((d) => d.fixed_client_id !== id));
    toast.success("Cliente removido");
  }, []);

  const createDelivery = useCallback(
    async (input: DeliveryInput) => {
      if (!user) return null;
      const ref = input.recording_at
        ? new Date(input.recording_at)
        : input.delivery_date
        ? new Date(input.delivery_date)
        : new Date();
      const { data, error } = await supabase
        .from("fixed_client_deliveries")
        .insert({
          user_id: user.id,
          fixed_client_id: input.fixed_client_id,
          title: input.title || "",
          script: input.script || "",
          location: input.location || "",
          notes: input.notes || "",
          status: input.status || "scheduled",
          recording_at: input.recording_at || null,
          delivery_date: input.delivery_date || null,
          cycle_year: ref.getFullYear(),
          cycle_month: ref.getMonth() + 1,
        })
        .select()
        .single();
      if (error || !data) {
        console.error(error);
        toast.error("Erro ao criar entrega");
        return null;
      }
      const d = normalizeDelivery(data);
      setDeliveries((p) => [...p, d]);
      toast.success("Entrega criada");
      return d;
    },
    [user]
  );

  const updateDelivery = useCallback(
    async (id: string, patch: Partial<Delivery>) => {
      const cleaned: any = { ...patch };
      delete cleaned.id;
      delete cleaned.user_id;
      delete cleaned.created_at;
      delete cleaned.cycle_year;
      delete cleaned.cycle_month;

      const { data, error } = await supabase
        .from("fixed_client_deliveries")
        .update(cleaned)
        .eq("id", id)
        .select()
        .single();
      if (error || !data) {
        console.error(error);
        toast.error("Erro ao atualizar entrega");
        return null;
      }
      const d = normalizeDelivery(data);
      setDeliveries((p) => p.map((x) => (x.id === id ? d : x)));
      return d;
    },
    []
  );

  const removeDelivery = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("fixed_client_deliveries")
      .delete()
      .eq("id", id);
    if (error) {
      console.error(error);
      toast.error("Erro ao remover");
      return;
    }
    setDeliveries((p) => p.filter((d) => d.id !== id));
    toast.success("Entrega removida");
  }, []);

  const duplicateDelivery = useCallback(
    async (id: string) => {
      const src = deliveries.find((d) => d.id === id);
      if (!src) return;
      await createDelivery({
        fixed_client_id: src.fixed_client_id,
        title: src.title ? `${src.title} (cópia)` : "",
        script: src.script,
        location: src.location,
        notes: src.notes,
        status: "scheduled",
        recording_at: null,
        delivery_date: null,
      });
    },
    [deliveries, createDelivery]
  );

  // Conta entregas concluídas (delivered/posted) num ciclo específico.
  const countDeliveredInCycle = useCallback(
    (clientId: string, year: number, month: number) =>
      deliveries.filter(
        (d) =>
          d.fixed_client_id === clientId &&
          d.cycle_year === year &&
          d.cycle_month === month &&
          DELIVERED_STATUSES.includes(d.status)
      ).length,
    [deliveries]
  );

  const deliveriesInCycle = useCallback(
    (clientId: string, year: number, month: number) =>
      deliveries.filter(
        (d) =>
          d.fixed_client_id === clientId &&
          d.cycle_year === year &&
          d.cycle_month === month
      ),
    [deliveries]
  );

  return {
    clients,
    deliveries,
    loading,
    createClient,
    updateClient,
    removeClient,
    createDelivery,
    updateDelivery,
    removeDelivery,
    duplicateDelivery,
    countDeliveredInCycle,
    deliveriesInCycle,
    cycleYear: cy,
    cycleMonth: cm,
    reload: load,
  };
}

function normalizeClient(row: any): FixedClient {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name || "",
    contact: row.contact || "",
    notes: row.notes || "",
    videos_per_month: Number(row.videos_per_month || 0),
    monthly_value: Number(row.monthly_value || 0),
    renewal_day: Number(row.renewal_day || 1),
    active: !!row.active,
    created_at: row.created_at,
  };
}

function normalizeDelivery(row: any): Delivery {
  return {
    id: row.id,
    fixed_client_id: row.fixed_client_id,
    user_id: row.user_id,
    title: row.title || "",
    script: row.script || "",
    location: row.location || "",
    notes: row.notes || "",
    status: (row.status || "scheduled") as DeliveryStatus,
    recording_at: row.recording_at,
    delivery_date: row.delivery_date,
    delivered_at: row.delivered_at,
    cycle_year: Number(row.cycle_year),
    cycle_month: Number(row.cycle_month),
    created_at: row.created_at,
  };
}
