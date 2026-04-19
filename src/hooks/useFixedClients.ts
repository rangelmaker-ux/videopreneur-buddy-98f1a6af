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

export type Delivery = {
  id: string;
  fixed_client_id: string;
  title: string;
  delivered_at: string;
  cycle_year: number;
  cycle_month: number;
};

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
      supabase.from("fixed_clients").select("*").order("created_at", { ascending: false }),
      supabase.from("fixed_client_deliveries").select("*")
        .eq("cycle_year", cy).eq("cycle_month", cm),
    ]);
    setClients((cs as any[] || []).map(normalize));
    setDeliveries((ds as any[] || []) as Delivery[]);
    setLoading(false);
  }, [user, cy, cm]);

  useEffect(() => { void load(); }, [load]);

  const createClient = useCallback(async (payload: Partial<FixedClient> & { name: string }) => {
    if (!user) return;
    const { data, error } = await supabase.from("fixed_clients").insert({
      user_id: user.id,
      name: payload.name,
      contact: payload.contact || "",
      notes: payload.notes || "",
      videos_per_month: payload.videos_per_month ?? 1,
      monthly_value: payload.monthly_value ?? 0,
      renewal_day: payload.renewal_day ?? 1,
      active: payload.active ?? true,
    }).select().single();
    if (error || !data) { console.error(error); toast.error("Erro ao salvar cliente"); return; }
    setClients((p) => [normalize(data), ...p]);
    toast.success("Cliente fixo criado");
  }, [user]);

  const updateClient = useCallback(async (id: string, patch: Partial<FixedClient>) => {
    const { data, error } = await supabase.from("fixed_clients").update(patch).eq("id", id).select().single();
    if (error || !data) { console.error(error); toast.error("Erro ao atualizar"); return; }
    setClients((p) => p.map((c) => (c.id === id ? normalize(data) : c)));
  }, []);

  const removeClient = useCallback(async (id: string) => {
    const { error } = await supabase.from("fixed_clients").delete().eq("id", id);
    if (error) { console.error(error); toast.error("Erro ao excluir"); return; }
    setClients((p) => p.filter((c) => c.id !== id));
    setDeliveries((p) => p.filter((d) => d.fixed_client_id !== id));
    toast.success("Cliente removido");
  }, []);

  const addDelivery = useCallback(async (clientId: string, title = "") => {
    if (!user) return;
    const { data, error } = await supabase.from("fixed_client_deliveries").insert({
      user_id: user.id,
      fixed_client_id: clientId,
      title,
      cycle_year: cy,
      cycle_month: cm,
    }).select().single();
    if (error || !data) { console.error(error); toast.error("Erro ao registrar entrega"); return; }
    setDeliveries((p) => [...p, data as Delivery]);
    toast.success("Entrega registrada");
  }, [user, cy, cm]);

  const removeDelivery = useCallback(async (deliveryId: string) => {
    const { error } = await supabase.from("fixed_client_deliveries").delete().eq("id", deliveryId);
    if (error) { console.error(error); toast.error("Erro ao remover"); return; }
    setDeliveries((p) => p.filter((d) => d.id !== deliveryId));
  }, []);

  const countForClient = (clientId: string) =>
    deliveries.filter((d) => d.fixed_client_id === clientId).length;

  return {
    clients, deliveries, loading,
    createClient, updateClient, removeClient,
    addDelivery, removeDelivery, countForClient,
    cycleYear: cy, cycleMonth: cm,
  };
}

function normalize(row: any): FixedClient {
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
