import jsPDF from "jspdf";
import { Quote, STATUS_LABEL } from "@/lib/quotes";
import { ProfessionalData, brl } from "@/lib/pricing";

const COLORS = {
  text: [20, 28, 48] as [number, number, number],
  muted: [110, 120, 140] as [number, number, number],
  accent: [33, 78, 184] as [number, number, number], // navy/indigo
  border: [220, 226, 234] as [number, number, number],
};

export function generateQuotePdf(quote: Quote, pro: ProfessionalData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  // Header bar
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 0, pageW, 8, "F");
  y += 12;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.text);
  doc.text("ORÇAMENTO", margin, y + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.text(formatDate(quote.created_at), pageW - margin, y + 16, { align: "right" });
  doc.text(`Status: ${STATUS_LABEL[quote.status]}`, pageW - margin, y + 30, { align: "right" });
  y += 40;

  // Professional block
  if (pro.business_name || pro.email || pro.phone) {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.setFont("helvetica", "bold");
    if (pro.business_name) { doc.text(pro.business_name, margin, y); y += 14; }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    const lines = [pro.cnpj, pro.email, pro.phone].filter(Boolean) as string[];
    if (lines.length) { doc.text(lines.join(" • "), margin, y); y += 14; }
    y += 6;
  }

  // Divider
  doc.setDrawColor(...COLORS.border);
  doc.line(margin, y, pageW - margin, y);
  y += 18;

  // Client + project
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.text("Cliente", margin, y);
  doc.text("Projeto", pageW / 2, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(quote.customer_name || "—", margin, y);
  doc.text(quote.project_name || "—", pageW / 2, y);
  y += 22;

  // Specs
  drawSection(doc, margin, pageW, y, "Especificações");
  y += 22;
  const totalDuration = `${quote.dur_minutes} min ${quote.dur_seconds ? quote.dur_seconds + "s" : ""}`.trim();
  drawRow(doc, margin, pageW, y, "Tipo de vídeo", quote.video_type_label); y += 16;
  drawRow(doc, margin, pageW, y, "Duração", totalDuration); y += 16;
  drawRow(doc, margin, pageW, y, "Nível de edição", editingLabel(quote.editing_level)); y += 16;
  drawRow(doc, margin, pageW, y, "Locações", String(quote.locations)); y += 22;

  // Breakdown
  drawSection(doc, margin, pageW, y, "Composição do valor");
  y += 22;
  const b = quote.breakdown;
  drawRow(doc, margin, pageW, y, "Valor base", brl(b.baseSubtotal || 0)); y += 16;
  drawRow(doc, margin, pageW, y, `Multiplicador edição (×${(b.editingMultiplier || 1).toFixed(2)})`, brl(b.baseAfterEditing || 0)); y += 16;
  if ((b.locationsExtra || 0) > 0) { drawRow(doc, margin, pageW, y, "Locações extras", brl(b.locationsExtra)); y += 16; }
  if (b.servicesDetail?.length) {
    y += 6;
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...COLORS.text);
    doc.text("Serviços adicionais", margin, y); y += 14;
    doc.setFont("helvetica", "normal");
    for (const s of b.servicesDetail) { drawRow(doc, margin, pageW, y, s.label, brl(s.value)); y += 14; }
  }

  y += 12;
  doc.setDrawColor(...COLORS.border);
  doc.line(margin, y, pageW - margin, y);
  y += 18;

  // Notes
  if (quote.notes) {
    drawSection(doc, margin, pageW, y, "Observações");
    y += 18;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...COLORS.muted);
    const lines = doc.splitTextToSize(quote.notes, pageW - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 12 + 14;
  }

  // Total box
  const boxH = 60;
  doc.setFillColor(245, 248, 255);
  doc.setDrawColor(...COLORS.accent);
  doc.roundedRect(margin, y, pageW - margin * 2, boxH, 8, 8, "FD");
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...COLORS.muted);
  doc.text("TOTAL", margin + 18, y + 24);
  doc.setFontSize(22); doc.setTextColor(...COLORS.accent);
  doc.text(brl(quote.total), pageW - margin - 18, y + 38, { align: "right" });

  // Footer
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...COLORS.muted);
  doc.text("Gerado por Videomaker Inteligente", pageW / 2, 820, { align: "center" });

  return doc;
}

function drawSection(doc: jsPDF, margin: number, pageW: number, y: number, label: string) {
  doc.setFillColor(...COLORS.accent);
  doc.rect(margin, y, 3, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.text(label.toUpperCase(), margin + 10, y + 10);
}

function drawRow(doc: jsPDF, margin: number, pageW: number, y: number, k: string, v: string) {
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted); doc.text(k, margin, y);
  doc.setTextColor(...COLORS.text);
  doc.text(v, pageW - margin, y, { align: "right" });
}

function editingLabel(l: string) {
  return l === "advanced" ? "Avançada" : l === "intermediate" ? "Intermediária" : "Básica";
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return ""; }
}

export function downloadQuotePdf(quote: Quote, pro: ProfessionalData) {
  const doc = generateQuotePdf(quote, pro);
  const fname = `orcamento-${slug(quote.customer_name)}-${slug(quote.project_name)}.pdf`;
  doc.save(fname);
}

export function shareQuoteOnWhatsapp(quote: Quote, pro: ProfessionalData) {
  const lines = [
    `*Orçamento — ${quote.project_name}*`,
    `Cliente: ${quote.customer_name}`,
    `Tipo: ${quote.video_type_label}`,
    `Duração: ${quote.dur_minutes}min ${quote.dur_seconds ? quote.dur_seconds + "s" : ""}`.trim(),
    `Nível: ${editingLabel(quote.editing_level)}`,
    `Locações: ${quote.locations}`,
    ``,
    `*Total: ${brl(quote.total)}*`,
  ];
  if (pro.business_name) lines.push(``, `_${pro.business_name}_`);
  const text = encodeURIComponent(lines.join("\n"));
  window.open(`https://wa.me/?text=${text}`, "_blank", "noopener");
}

function slug(s: string) {
  return (s || "sem-nome").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
}
