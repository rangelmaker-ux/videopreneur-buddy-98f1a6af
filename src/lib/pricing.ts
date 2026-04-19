// Tipos e cálculos de precificação compartilhados entre Calculadora e Configurações

export type EditingLevel = "basic" | "intermediate" | "advanced";

export type AdditionalServices = {
  motion: boolean;
  color: boolean;
  freelancer: boolean;
  script: boolean;
  story: boolean;
  drone: boolean;
  audio: boolean;
  subs: boolean;
  multi: boolean;
};

export type VideoConfig = {
  id: string;
  user_id: string;
  video_type_key: string;
  video_type_label: string;
  base_rate: number;
  location_cost: number;
  freelancer_cost: number;
  basic_mult: number;
  inter_mult: number;
  adv_mult: number;
  motion_cost: number;
  color_cost: number;
  script_cost: number;
  story_cost: number;
  drone_cost: number;
  audio_cost: number;
  subs_cost: number;
  multi_cost: number;
  sort_order: number;
};

export type ProfessionalData = {
  id?: string;
  user_id?: string;
  business_name: string | null;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
};

export type CalculatorInput = {
  customerName: string;
  projectName: string;
  notes: string;
  videoTypeKey: string;
  durMinutes: number;
  durSeconds: number;
  locations: number;
  editingLevel: EditingLevel;
  services: AdditionalServices;
};

export const EMPTY_SERVICES: AdditionalServices = {
  motion: false, color: false, freelancer: false, script: false, story: false,
  drone: false, audio: false, subs: false, multi: false,
};

export const EMPTY_INPUT: CalculatorInput = {
  customerName: "",
  projectName: "",
  notes: "",
  videoTypeKey: "",
  durMinutes: 1,
  durSeconds: 0,
  locations: 1,
  editingLevel: "basic",
  services: { ...EMPTY_SERVICES },
};

export type PriceBreakdown = {
  totalMinutes: number;
  baseSubtotal: number;
  editingMultiplier: number;
  baseAfterEditing: number;
  locationsExtra: number;
  servicesTotal: number;
  servicesDetail: { label: string; value: number }[];
  total: number;
};

export function calcPrice(input: CalculatorInput, cfg: VideoConfig | undefined): PriceBreakdown {
  const empty: PriceBreakdown = {
    totalMinutes: 0, baseSubtotal: 0, editingMultiplier: 1, baseAfterEditing: 0,
    locationsExtra: 0, servicesTotal: 0, servicesDetail: [], total: 0,
  };
  if (!cfg) return empty;

  const totalMinutes = Math.max(0, (input.durMinutes || 0) + (input.durSeconds || 0) / 60);
  const baseSubtotal = totalMinutes * (cfg.base_rate || 0);

  const editingMultiplier =
    input.editingLevel === "advanced" ? (cfg.adv_mult || 1) :
    input.editingLevel === "intermediate" ? (cfg.inter_mult || 1) :
    (cfg.basic_mult || 1);

  const baseAfterEditing = baseSubtotal * editingMultiplier;

  // Locações extras (a primeira está incluída)
  const extraLocations = Math.max(0, (input.locations || 1) - 1);
  const locationsExtra = extraLocations * (cfg.location_cost || 0);

  const servicesDetail: { label: string; value: number }[] = [];
  const s = input.services;
  if (s.motion) servicesDetail.push({ label: "Motion Graphics", value: cfg.motion_cost });
  if (s.color) servicesDetail.push({ label: "Correção de Cor", value: cfg.color_cost });
  if (s.freelancer) servicesDetail.push({ label: "Freelancer", value: cfg.freelancer_cost });
  if (s.script) servicesDetail.push({ label: "Roteiro", value: cfg.script_cost });
  if (s.story) servicesDetail.push({ label: "Storyboard", value: cfg.story_cost });
  if (s.drone) servicesDetail.push({ label: "Drone", value: cfg.drone_cost });
  if (s.audio) servicesDetail.push({ label: "Áudio Profissional", value: cfg.audio_cost });
  if (s.subs) servicesDetail.push({ label: "Legendas", value: cfg.subs_cost });
  if (s.multi) servicesDetail.push({ label: "Multi-Plataforma", value: cfg.multi_cost });
  const servicesTotal = servicesDetail.reduce((a, b) => a + (b.value || 0), 0);

  const total = baseAfterEditing + locationsExtra + servicesTotal;

  return {
    totalMinutes, baseSubtotal, editingMultiplier, baseAfterEditing,
    locationsExtra, servicesTotal, servicesDetail, total,
  };
}

export function brl(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}
