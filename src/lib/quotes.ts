import { AdditionalServices, EditingLevel, PriceBreakdown } from "@/lib/pricing";

export type QuoteStatus = "draft" | "sent" | "approved";

export const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  approved: "Aprovado",
};

export const STATUS_BADGE: Record<QuoteStatus, string> = {
  draft: "bg-muted text-muted-foreground border border-border",
  sent: "bg-accent/15 text-accent border border-accent/40",
  approved: "bg-success/15 text-success border border-success/40",
};

export type Quote = {
  id: string;
  user_id: string;
  customer_name: string;
  project_name: string;
  notes: string;
  status: QuoteStatus;
  video_type_key: string;
  video_type_label: string;
  editing_level: EditingLevel;
  dur_minutes: number;
  dur_seconds: number;
  locations: number;
  services: AdditionalServices;
  breakdown: PriceBreakdown;
  total: number;
  fixed_client_id: string | null;
  created_at: string;
  updated_at: string;
};
