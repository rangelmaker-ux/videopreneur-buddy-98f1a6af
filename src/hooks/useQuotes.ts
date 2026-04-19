import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Quote, QuoteStatus } from "@/lib/quotes";
import { toast } from "sonner";

export function useQuotes() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Erro ao carregar orçamentos");
    } else {
      setQuotes((data as any[]).map(normalize));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  const createQuote = useCallback(async (payload: Omit<Quote, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("quotes")
      .insert({ ...payload, user_id: user.id, services: payload.services as any, breakdown: payload.breakdown as any })
      .select()
      .single();
    if (error || !data) {
      console.error(error);
      toast.error("Não foi possível salvar o orçamento");
      return null;
    }
    const q = normalize(data);
    setQuotes((p) => [q, ...p]);
    toast.success("Orçamento salvo");
    return q;
  }, [user]);

  const updateQuote = useCallback(async (id: string, patch: Partial<Quote>) => {
    const dbPatch: any = { ...patch };
    if (patch.services) dbPatch.services = patch.services as any;
    if (patch.breakdown) dbPatch.breakdown = patch.breakdown as any;
    const { data, error } = await supabase
      .from("quotes").update(dbPatch).eq("id", id).select().single();
    if (error || !data) {
      console.error(error); toast.error("Erro ao atualizar"); return;
    }
    const q = normalize(data);
    setQuotes((p) => p.map((x) => (x.id === id ? q : x)));
  }, []);

  const setStatus = useCallback((id: string, status: QuoteStatus) => updateQuote(id, { status }), [updateQuote]);

  const removeQuote = useCallback(async (id: string) => {
    const { error } = await supabase.from("quotes").delete().eq("id", id);
    if (error) { console.error(error); toast.error("Erro ao excluir"); return; }
    setQuotes((p) => p.filter((x) => x.id !== id));
    toast.success("Orçamento excluído");
  }, []);

  return { quotes, loading, refresh, createQuote, updateQuote, setStatus, removeQuote };
}

function normalize(row: any): Quote {
  return {
    id: row.id,
    user_id: row.user_id,
    customer_name: row.customer_name || "",
    project_name: row.project_name || "",
    notes: row.notes || "",
    status: (row.status || "draft") as QuoteStatus,
    video_type_key: row.video_type_key || "",
    video_type_label: row.video_type_label || "",
    editing_level: (row.editing_level || "basic"),
    dur_minutes: Number(row.dur_minutes || 0),
    dur_seconds: Number(row.dur_seconds || 0),
    locations: Number(row.locations || 1),
    services: row.services || {},
    breakdown: row.breakdown || {},
    total: Number(row.total || 0),
    fixed_client_id: row.fixed_client_id || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
