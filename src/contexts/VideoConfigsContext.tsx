import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { VideoConfig, ProfessionalData } from "@/lib/pricing";

export type SyncStatus = "idle" | "saving" | "saved" | "error";

type Ctx = {
  loading: boolean;
  configs: VideoConfig[];
  professional: ProfessionalData;
  syncStatus: SyncStatus;
  updateConfig: (id: string, patch: Partial<VideoConfig>) => void;
  addConfig: (label: string) => Promise<void>;
  removeConfig: (id: string) => Promise<void>;
  updateProfessional: (patch: Partial<ProfessionalData>) => void;
  resetConfig: (id: string) => void;
};

const VideoConfigsContext = createContext<Ctx | undefined>(undefined);

const EMPTY_PRO: ProfessionalData = {
  business_name: "", cnpj: "", phone: "", email: "", logo_url: "",
};

export function VideoConfigsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<VideoConfig[]>([]);
  const [professional, setProfessional] = useState<ProfessionalData>(EMPTY_PRO);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  // Pending changes queue (id -> patch) and pro pending
  const pendingConfigs = useRef<Map<string, Partial<VideoConfig>>>(new Map());
  const pendingPro = useRef<Partial<ProfessionalData> | null>(null);
  const debounceRef = useRef<number | null>(null);

  // Load
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let active = true;
    (async () => {
      setLoading(true);
      const [{ data: cfgs }, { data: pro }] = await Promise.all([
        supabase.from("video_configs").select("*").order("sort_order", { ascending: true }),
        supabase.from("professional_data").select("*").maybeSingle(),
      ]);
      if (!active) return;
      setConfigs((cfgs as any[] || []).map(normalizeConfig));
      setProfessional(pro ? { ...EMPTY_PRO, ...pro } : EMPTY_PRO);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user]);

  const flush = useCallback(async () => {
    if (!user) return;
    const cfgPatches = Array.from(pendingConfigs.current.entries());
    const proPatch = pendingPro.current;
    if (cfgPatches.length === 0 && !proPatch) return;
    pendingConfigs.current.clear();
    pendingPro.current = null;
    setSyncStatus("saving");
    try {
      const tasks: Promise<any>[] = [];
      for (const [id, patch] of cfgPatches) {
        tasks.push(Promise.resolve(supabase.from("video_configs").update(patch).eq("id", id)));
      }
      if (proPatch) {
        tasks.push(
          Promise.resolve(
            supabase.from("professional_data").upsert(
              { user_id: user.id, ...proPatch },
              { onConflict: "user_id" }
            )
          )
        );
      }
      const results = await Promise.all(tasks);
      const err = results.find((r: any) => r?.error);
      if (err?.error) { console.error(err.error); setSyncStatus("error"); return; }
      setSyncStatus("saved");
      window.setTimeout(() => setSyncStatus((s) => (s === "saved" ? "idle" : s)), 1800);
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
    }
  }, [user]);

  const scheduleSave = useCallback(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    setSyncStatus("saving");
    debounceRef.current = window.setTimeout(() => { void flush(); }, 1500);
  }, [flush]);

  // Flush on tab hide / before unload
  useEffect(() => {
    const onHide = () => { void flush(); };
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [flush]);

  const updateConfig = useCallback((id: string, patch: Partial<VideoConfig>) => {
    setConfigs((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const cur = pendingConfigs.current.get(id) || {};
    pendingConfigs.current.set(id, { ...cur, ...patch });
    scheduleSave();
  }, [scheduleSave]);

  const updateProfessional = useCallback((patch: Partial<ProfessionalData>) => {
    setProfessional((prev) => ({ ...prev, ...patch }));
    pendingPro.current = { ...(pendingPro.current || {}), ...patch };
    scheduleSave();
  }, [scheduleSave]);

  const addConfig = useCallback(async (label: string) => {
    if (!user) return;
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") + "_" + Math.random().toString(36).slice(2, 6);
    const sortOrder = configs.length + 1;
    setSyncStatus("saving");
    const { data, error } = await supabase.from("video_configs").insert({
      user_id: user.id, video_type_key: key, video_type_label: label, sort_order: sortOrder,
    }).select().single();
    if (error || !data) { console.error(error); setSyncStatus("error"); return; }
    setConfigs((prev) => [...prev, normalizeConfig(data)]);
    setSyncStatus("saved");
    window.setTimeout(() => setSyncStatus("idle"), 1500);
  }, [user, configs.length]);

  const removeConfig = useCallback(async (id: string) => {
    setSyncStatus("saving");
    const { error } = await supabase.from("video_configs").delete().eq("id", id);
    if (error) { console.error(error); setSyncStatus("error"); return; }
    setConfigs((prev) => prev.filter((c) => c.id !== id));
    setSyncStatus("saved");
    window.setTimeout(() => setSyncStatus("idle"), 1500);
  }, []);

  const resetConfig = useCallback((id: string) => {
    updateConfig(id, {
      base_rate: 0, location_cost: 0, freelancer_cost: 0,
      basic_mult: 1, inter_mult: 1, adv_mult: 1,
      motion_cost: 0, color_cost: 0, script_cost: 0, story_cost: 0,
      drone_cost: 0, audio_cost: 0, subs_cost: 0, multi_cost: 0,
    });
  }, [updateConfig]);

  return (
    <VideoConfigsContext.Provider value={{
      loading, configs, professional, syncStatus,
      updateConfig, addConfig, removeConfig, updateProfessional, resetConfig,
    }}>
      {children}
    </VideoConfigsContext.Provider>
  );
}

function normalizeConfig(row: any): VideoConfig {
  return {
    id: row.id, user_id: row.user_id,
    video_type_key: row.video_type_key, video_type_label: row.video_type_label,
    base_rate: Number(row.base_rate || 0),
    location_cost: Number(row.location_cost || 0),
    freelancer_cost: Number(row.freelancer_cost || 0),
    basic_mult: Number(row.basic_mult || 1),
    inter_mult: Number(row.inter_mult || 1),
    adv_mult: Number(row.adv_mult || 1),
    motion_cost: Number(row.motion_cost || 0),
    color_cost: Number(row.color_cost || 0),
    script_cost: Number(row.script_cost || 0),
    story_cost: Number(row.story_cost || 0),
    drone_cost: Number(row.drone_cost || 0),
    audio_cost: Number(row.audio_cost || 0),
    subs_cost: Number(row.subs_cost || 0),
    multi_cost: Number(row.multi_cost || 0),
    sort_order: Number(row.sort_order || 0),
  };
}

export function useVideoConfigs() {
  const ctx = useContext(VideoConfigsContext);
  if (!ctx) throw new Error("useVideoConfigs must be used inside VideoConfigsProvider");
  return ctx;
}
