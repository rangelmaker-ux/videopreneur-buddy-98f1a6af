import { useMemo, useState, useEffect } from "react";
import { useVideoConfigs } from "@/contexts/VideoConfigsContext";
import { useQuotes } from "@/hooks/useQuotes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalculatorInput, EMPTY_INPUT, calcPrice, brl, EditingLevel } from "@/lib/pricing";
import { Loader2, Save, X, Sparkles } from "lucide-react";
import { toast } from "sonner";

const SERVICE_FIELDS: { key: keyof CalculatorInput["services"]; label: string }[] = [
  { key: "motion", label: "Motion Graphics" },
  { key: "color", label: "Correção de Cor" },
  { key: "freelancer", label: "Freelancer" },
  { key: "script", label: "Roteiro" },
  { key: "story", label: "Storyboard" },
  { key: "drone", label: "Drone" },
  { key: "audio", label: "Áudio Profissional" },
  { key: "subs", label: "Legendas" },
  { key: "multi", label: "Multi-Plataforma" },
];

export default function CalculatorTab({ onSaved }: { onSaved?: () => void } = {}) {
  const { configs, loading } = useVideoConfigs();
  const { createQuote } = useQuotes();
  const [saving, setSaving] = useState(false);
  const [input, setInput] = useState<CalculatorInput>({
    ...EMPTY_INPUT,
    videoTypeKey: "",
  });
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleStorage = () => setTick(t => t + 1);
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Pre-select first available video type
  const selectedKey = input.videoTypeKey || configs[0]?.video_type_key || "";
  const cfg = useMemo(() => configs.find((c) => c.video_type_key === selectedKey), [configs, selectedKey]);
  const breakdown = useMemo(() => calcPrice({ ...input, videoTypeKey: selectedKey }, cfg), [input, cfg, selectedKey]);

  const setField = <K extends keyof CalculatorInput>(k: K, v: CalculatorInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  const setService = (k: keyof CalculatorInput["services"], v: boolean) =>
    setInput((p) => ({ ...p, services: { ...p.services, [k]: v } }));

  const handleSave = async () => {
    if (!input.customerName || !input.projectName) {
      toast.error("Preencha nome do cliente e do projeto.");
      return;
    }
    if (!cfg) {
      toast.error("Selecione um tipo de vídeo.");
      return;
    }
    setSaving(true);
    const created = await createQuote({
      customer_name: input.customerName,
      project_name: input.projectName,
      notes: input.notes,
      status: "draft",
      video_type_key: cfg.video_type_key,
      video_type_label: cfg.video_type_label,
      editing_level: input.editingLevel,
      dur_minutes: input.durMinutes,
      dur_seconds: input.durSeconds,
      locations: input.locations,
      services: input.services,
      breakdown,
      total: breakdown.total,
      fixed_client_id: null,
    });
    setSaving(false);
    if (created) {
      setInput({ ...EMPTY_INPUT, videoTypeKey: selectedKey });
      onSaved?.();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center space-y-3">
        <p className="text-sm">Nenhum tipo de vídeo configurado.</p>
        <p className="text-xs text-muted-foreground">Vá em Configurações para criar tipos e definir os custos.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px] animate-fade-in">
      {/* Left: form */}
      <div className="space-y-5">
        {/* Cliente / Projeto */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <h3 className="font-display text-base font-semibold">Projeto</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="customer">Nome do Cliente</Label>
              <Input id="customer" value={input.customerName} onChange={(e) => setField("customerName", e.target.value)} placeholder="Ex.: João Silva" maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project">Nome do Projeto</Label>
              <Input id="project" value={input.projectName} onChange={(e) => setField("projectName", e.target.value)} placeholder="Ex.: Vídeo institucional" maxLength={120} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" value={input.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Detalhes adicionais do briefing…" rows={2} maxLength={1000} />
          </div>
        </div>

        {/* Especificações */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <h3 className="font-display text-base font-semibold">Especificações</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tipo de Vídeo</Label>
              <Select value={selectedKey} onValueChange={(v) => setField("videoTypeKey", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {configs.map((c) => (
                    <SelectItem key={c.id} value={c.video_type_key}>{c.video_type_label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nível de Edição</Label>
              <Select value={input.editingLevel} onValueChange={(v) => setField("editingLevel", v as EditingLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Básica</SelectItem>
                  <SelectItem value="intermediate">Intermediária</SelectItem>
                  <SelectItem value="advanced">Avançada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dur-min">Duração (minutos)</Label>
              <Input id="dur-min" type="number" min={0} max={999} value={input.durMinutes} onChange={(e) => setField("durMinutes", Math.max(0, parseInt(e.target.value || "0")))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dur-sec">Duração (segundos)</Label>
              <Input id="dur-sec" type="number" min={0} max={59} value={input.durSeconds} onChange={(e) => setField("durSeconds", Math.max(0, Math.min(59, parseInt(e.target.value || "0"))))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="locations">Locações</Label>
              <Input id="locations" type="number" min={1} max={50} value={input.locations} onChange={(e) => setField("locations", Math.max(1, parseInt(e.target.value || "1")))} />
              <p className="text-[11px] text-muted-foreground">A primeira locação está incluída no valor base.</p>
            </div>
          </div>
        </div>

        {/* Serviços adicionais */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <h3 className="font-display text-base font-semibold">Serviços adicionais</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {SERVICE_FIELDS.map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors">
                <span className="text-sm">{label}</span>
                <Switch checked={input.services[key]} onCheckedChange={(v) => setService(key, v)} />
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Right: summary (sticky on desktop) */}
      <div className="lg:sticky lg:top-24 lg:self-start space-y-4">
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold">Resumo</h3>
          </div>

          <div className="space-y-2 text-sm">
            <Row label="Duração total" value={`${breakdown.totalMinutes.toFixed(2)} min`} />
            <Row label={`Base (${cfg ? brl(cfg.base_rate) : "—"}/min)`} value={brl(breakdown.baseSubtotal)} />
            <Row label={`Edição × ${breakdown.editingMultiplier.toFixed(2)}`} value={brl(breakdown.baseAfterEditing)} muted />
            {breakdown.locationsExtra > 0 && (
              <Row label="Locações extras" value={brl(breakdown.locationsExtra)} />
            )}
            {breakdown.servicesDetail.length > 0 && (
              <div className="pt-2 border-t border-border/40 space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Serviços</p>
                {breakdown.servicesDetail.map((s) => (
                  <Row key={s.label} label={s.label} value={brl(s.value)} small />
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border/40">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="font-display text-3xl font-bold gradient-text">{brl(breakdown.total)}</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90">
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Salvar Orçamento
            </Button>
            <Button variant="outline" size="icon" onClick={() => setInput({ ...EMPTY_INPUT, videoTypeKey: selectedKey })} aria-label="Limpar">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted, small }: { label: string; value: string; muted?: boolean; small?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${small ? "text-xs" : ""}`}>
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span className={`tabular-nums ${muted ? "text-muted-foreground" : "font-medium"}`}>{value}</span>
    </div>
  );
}
