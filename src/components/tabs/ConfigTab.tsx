import { useState, useEffect } from "react";
import { useVideoConfigs } from "@/contexts/VideoConfigsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, RotateCcw, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const COST_FIELDS: { key: keyof import("@/lib/pricing").VideoConfig; label: string; suffix?: string }[] = [
  { key: "base_rate", label: "Valor base por minuto", suffix: "R$/min" },
  { key: "location_cost", label: "Locação extra", suffix: "R$" },
  { key: "freelancer_cost", label: "Freelancer", suffix: "R$" },
  { key: "motion_cost", label: "Motion Graphics", suffix: "R$" },
  { key: "color_cost", label: "Correção de Cor", suffix: "R$" },
  { key: "script_cost", label: "Roteiro", suffix: "R$" },
  { key: "story_cost", label: "Storyboard", suffix: "R$" },
  { key: "drone_cost", label: "Drone", suffix: "R$" },
  { key: "audio_cost", label: "Áudio Profissional", suffix: "R$" },
  { key: "subs_cost", label: "Legendas", suffix: "R$" },
  { key: "multi_cost", label: "Multi-Plataforma", suffix: "R$" },
];

const MULT_FIELDS: { key: "basic_mult" | "inter_mult" | "adv_mult"; label: string }[] = [
  { key: "basic_mult", label: "Edição Básica (×)" },
  { key: "inter_mult", label: "Edição Intermediária (×)" },
  { key: "adv_mult", label: "Edição Avançada (×)" },
];

export default function ConfigTab() {
  const { configs, loading, professional, updateConfig, addConfig, removeConfig, updateProfessional, resetConfig } = useVideoConfigs();
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const cfg = configs.find((c) => c.video_type_key === (selectedKey || configs[0]?.video_type_key));

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Dados profissionais */}
      <section className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base font-semibold">Dados profissionais</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome / Empresa">
            <Input value={professional.business_name || ""} onChange={(e) => updateProfessional({ business_name: e.target.value })} maxLength={120} />
          </Field>
          <Field label="CNPJ / CPF">
            <Input value={professional.cnpj || ""} onChange={(e) => updateProfessional({ cnpj: e.target.value })} maxLength={20} />
          </Field>
          <Field label="Telefone">
            <Input value={professional.phone || ""} onChange={(e) => updateProfessional({ phone: e.target.value })} maxLength={30} />
          </Field>
          <Field label="E-mail de contato">
            <Input type="email" value={professional.email || ""} onChange={(e) => updateProfessional({ email: e.target.value })} maxLength={255} />
          </Field>
        </div>
      </section>

      {/* Tipos de vídeo */}
      <section className="glass rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <h3 className="font-display text-base font-semibold">Tipo de vídeo a configurar</h3>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Novo tipo</Button>
            </DialogTrigger>
            <DialogContent className="glass-strong border-border/60">
              <DialogHeader><DialogTitle>Novo tipo de vídeo</DialogTitle></DialogHeader>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex.: Casamento" maxLength={60} />
              </div>
              <DialogFooter>
                <Button onClick={async () => {
                  if (!newName.trim()) return;
                  await addConfig(newName.trim());
                  setNewName("");
                  setAddOpen(false);
                }} className="bg-gradient-primary text-primary-foreground">Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <Select value={cfg?.video_type_key || ""} onValueChange={setSelectedKey}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {configs.map((c) => (
                  <SelectItem key={c.id} value={c.video_type_key}>{c.video_type_label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {cfg && (
            <>
              <Button variant="ghost" size="sm" onClick={() => resetConfig(cfg.id)}>
                <RotateCcw className="h-4 w-4 mr-1" /> Zerar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4 mr-1" /> Excluir</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-strong border-border/60">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir “{cfg.video_type_label}”?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { void removeConfig(cfg.id); setSelectedKey(""); }}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>

        {cfg && (
          <div className="space-y-5 pt-2">
            <Field label="Rótulo do tipo">
              <Input value={cfg.video_type_label} onChange={(e) => updateConfig(cfg.id, { video_type_label: e.target.value })} maxLength={60} />
            </Field>

            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Multiplicadores de edição</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {MULT_FIELDS.map(({ key, label }) => (
                  <NumberField
                    key={key}
                    label={label}
                    value={cfg[key]}
                    step={0.05}
                    onChange={(v) => updateConfig(cfg.id, { [key]: v } as any)}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Custos</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {COST_FIELDS.map(({ key, label, suffix }) => (
                  <NumberField
                    key={key as string}
                    label={label}
                    suffix={suffix}
                    value={(cfg as any)[key]}
                    step={1}
                    onChange={(v) => updateConfig(cfg.id, { [key]: v } as any)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function NumberField({ label, value, onChange, suffix, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; suffix?: string; step?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <Input
          type={typeof window !== 'undefined' && localStorage.getItem("vmi:values_hidden") === "true" ? "password" : "number"}
          step={step}
          min={0}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={suffix ? "pr-14" : ""}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">{suffix}</span>
        )}
      </div>
    </div>
  );
}
