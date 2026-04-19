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
  fixed_client_id: string | null;
  quote_id: string | null;
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
  // Hidratado em runtime quando origem é orçamento
  quote_customer_name?: string | null;
  quote_project_name?: string | null;
  quote_total?: number | null;
};

export type QuoteClient = {
  quote_id: string;
  customer_name: string;
  project_name: string;
  total: number;
  deliveries: Delivery[];
};

export type DeliveryInput = Partial<
  Omit<Delivery, "id" | "user_id" | "created_at" | "cycle_year" | "cycle_month">
> & {
  fixed_client_id?: string | null;
  quote_id?: string | null;
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
    const [{ data: cs }, { data: ds }, { data: qs }] = await Promise.all([
      supabase
        .from("fixed_clients")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("fixed_client_deliveries")
        .select("*")
        .order("recording_at", { ascending: true, nullsFirst: false }),
      // Carrega nomes dos clientes dos orçamentos para hidratar entregas avulsas
      supabase
        .from("quotes")
        .select("id, customer_name, project_name, total, status"),
    ]);
    const quotesMap = new Map<
      string,
      { customer_name: string; project_name: string; total: number; status: string }
    >();
    ((qs as any[]) || []).forEach((q) =>
      quotesMap.set(q.id, {
        customer_name: q.customer_name || "",
        project_name: q.project_name || "",
        total: Number(q.total || 0),
        status: q.status || "",
      })
    );
    setClients(((cs as any[]) || []).map(normalizeClient));
    setDeliveries(
      ((ds as any[]) || []).map((row) => {
        const d = normalizeDelivery(row);
        if (d.quote_id) {
          const q = quotesMap.get(d.quote_id);
          if (q) {
            d.quote_customer_name = q.customer_name;
            d.quote_project_name = q.project_name;
            d.quote_total = q.total;
          }
        }
        return d;
      })
    );
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
      if (!input.fixed_client_id && !input.quote_id) {
        toast.error("Selecione um cliente fixo ou um orçamento");
        return null;
      }
      const ref = input.recording_at
        ? new Date(input.recording_at)
        : input.delivery_date
        ? new Date(input.delivery_date)
        : new Date();
      const { data, error } = await supabase
        .from("fixed_client_deliveries")
        .insert({
          user_id: user.id,
          fixed_client_id: input.fixed_client_id || null,
          quote_id: input.quote_id || null,
          title: input.title || "",
          script: input.script || "",
          location: input.location || "",
          notes: input.notes || "",
          status: input.status || "scheduled",
          recording_at: input.recording_at || null,
          delivery_date: input.delivery_date || null,
          cycle_year: ref.getFullYear(),
          cycle_month: ref.getMonth() + 1,
        } as any)
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
      delete cleaned.quote_customer_name;

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
      setDeliveries((p) => p.map((x) => (x.id === id ? { ...x, ...d } : x)));
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
        quote_id: null, // não duplica o vínculo de orçamento
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

  // Marca rapidamente como entregue (ou desmarca, voltando para 'scheduled').
  const markDelivered = useCallback(
    async (id: string) => {
      const cur = deliveries.find((d) => d.id === id);
      if (!cur) return;
      const next: DeliveryStatus = DELIVERED_STATUSES.includes(cur.status)
        ? "scheduled"
        : "delivered";
      await updateDelivery(id, { status: next });
    },
    [deliveries, updateDelivery]
  );

  // Gera N slots vazios para o ciclo, completando até atingir videos_per_month do cliente.
  const generateMonthSlots = useCallback(
    async (clientId: string, year: number, month: number) => {
      if (!user) return;
      const client = clients.find((c) => c.id === clientId);
      if (!client) return;
      const existing = deliveries.filter(
        (d) =>
          d.fixed_client_id === clientId &&
          d.cycle_year === year &&
          d.cycle_month === month
      ).length;
      const target = client.videos_per_month;
      const toCreate = Math.max(0, target - existing);
      if (toCreate === 0) {
        toast.info("Ciclo já tem todos os vídeos planejados");
        return;
      }
      const rows = Array.from({ length: toCreate }).map((_, i) => ({
        user_id: user.id,
        fixed_client_id: clientId,
        title: `Vídeo ${existing + i + 1}/${target}`,
        script: "",
        location: "",
        notes: "",
        status: "scheduled" as DeliveryStatus,
        recording_at: null,
        delivery_date: null,
        cycle_year: year,
        cycle_month: month,
      }));
      const { data, error } = await supabase
        .from("fixed_client_deliveries")
        .insert(rows as any)
        .select();
      if (error || !data) {
        console.error(error);
        toast.error("Erro ao gerar slots");
        return;
      }
      const created = (data as any[]).map(normalizeDelivery);
      setDeliveries((p) => [...p, ...created]);
      toast.success(`${toCreate} vídeo(s) adicionado(s) ao ciclo`);
    },
    [user, clients, deliveries]
  );

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

  // Agrupa entregas vindas de orçamentos (clientes "por projeto")
  const quoteClients: QuoteClient[] = (() => {
    const map = new Map<string, QuoteClient>();
    deliveries.forEach((d) => {
      if (!d.quote_id) return;
      const existing = map.get(d.quote_id);
      if (existing) {
        existing.deliveries.push(d);
      } else {
        map.set(d.quote_id, {
          quote_id: d.quote_id,
          customer_name: d.quote_customer_name || "Cliente",
          project_name: d.quote_project_name || "",
          total: d.quote_total || 0,
          deliveries: [d],
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.customer_name.localeCompare(b.customer_name)
    );
  })();

  return {
    clients,
    quoteClients,
    deliveries,
    loading,
    createClient,
    updateClient,
    removeClient,
    createDelivery,
    updateDelivery,
    removeDelivery,
    duplicateDelivery,
    markDelivered,
    generateMonthSlots,
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
    fixed_client_id: row.fixed_client_id || null,
    quote_id: row.quote_id || null,
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
