import { useMemo, useState } from "react";
import { useQuotes } from "@/hooks/useQuotes";
import { useFixedClients } from "@/hooks/useFixedClients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Line,
  LineChart,
  ComposedChart,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Wallet,
  Target,
  Trophy,
  Repeat,
  FileText,
} from "lucide-react";

const BRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
];

type Range = "30d" | "90d" | "year" | "all";

export default function ResultsTab() {
  const { quotes, loading } = useQuotes();
  const { clients } = useFixedClients();
  const [range, setRange] = useState<Range>("90d");

  const filtered = useMemo(() => {
    if (range === "all") return quotes;
    const now = Date.now();
    const cutoff =
      range === "30d"
        ? now - 30 * 86400000
        : range === "90d"
        ? now - 90 * 86400000
        : new Date(new Date().getFullYear(), 0, 1).getTime();
    return quotes.filter((q) => new Date(q.created_at).getTime() >= cutoff);
  }, [quotes, range]);

  const approved = filtered.filter((q) => q.status === "approved");
  const sent = filtered.filter((q) => q.status === "sent");

  const revenue = approved.reduce((s, q) => s + Number(q.total || 0), 0);
  const recurring = clients
    .filter((c) => c.active)
    .reduce((s, c) => s + Number(c.monthly_value || 0), 0);

  const ticket = approved.length ? revenue / approved.length : 0;
  const considered = approved.length + sent.length;
  const approvalRate = considered ? (approved.length / considered) * 100 : 0;

  // Faturamento mensal (6 meses reais + 3 meses de projeção)
  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    const labels: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      labels.push({ key, label });
      map.set(key, 0);
    }
    quotes
      .filter((q) => q.status === "approved")
      .forEach((q) => {
        const d = new Date(q.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (map.has(key)) map.set(key, (map.get(key) || 0) + Number(q.total || 0));
      });

    const realRows = labels.map(({ key, label }) => ({
      month: label,
      total: map.get(key) || 0,
      projection: null as number | null,
    }));

    // Média móvel dos últimos 3 meses reais + recorrente mensal
    const last3 = realRows.slice(-3).map((r) => r.total);
    const avg3 = last3.length ? last3.reduce((a, b) => a + b, 0) / last3.length : 0;
    const projectedValue = avg3 + recurring;

    // Ancora a linha no último mês real
    if (realRows.length) {
      realRows[realRows.length - 1].projection = realRows[realRows.length - 1].total;
    }

    const future: typeof realRows = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      future.push({ month: label, total: 0, projection: projectedValue });
    }
    return [...realRows, ...future];
  }, [quotes, recurring]);

  // Top tipos de vídeo (por receita aprovada)
  const topTypes = useMemo(() => {
    const map = new Map<string, { label: string; total: number; count: number }>();
    approved.forEach((q) => {
      const cur = map.get(q.video_type_key) || {
        label: q.video_type_label,
        total: 0,
        count: 0,
      };
      cur.total += Number(q.total || 0);
      cur.count += 1;
      map.set(q.video_type_key, cur);
    });
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [approved]);

  // Distribuição por status (todos no período)
  const statusDist = useMemo(() => {
    const labels: Record<string, string> = {
      draft: "Rascunho",
      sent: "Enviado",
      approved: "Aprovado",
    };
    const counts: Record<string, number> = { draft: 0, sent: 0, approved: 0 };
    filtered.forEach((q) => (counts[q.status] = (counts[q.status] || 0) + 1));
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: labels[k] || k, value: v, key: k }));
  }, [filtered]);

  const monthlyCount = useMonthlyCount(quotes);

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
        Carregando resultados...
      </div>
    );
  }

  if (!quotes.length) {
    return (
      <div className="glass rounded-2xl p-10 text-center space-y-2">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="font-display text-lg">Sem dados ainda</p>
        <p className="text-sm text-muted-foreground">
          Crie e aprove orçamentos na Calculadora para ver seus resultados aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtro de período */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl tracking-tight">Resultados</h2>
          <p className="text-xs text-muted-foreground">
            Indicadores e gráficos do seu negócio.
          </p>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList className="bg-muted/40">
            <TabsTrigger value="30d" className="text-xs">30 dias</TabsTrigger>
            <TabsTrigger value="90d" className="text-xs">90 dias</TabsTrigger>
            <TabsTrigger value="year" className="text-xs">Ano</TabsTrigger>
            <TabsTrigger value="all" className="text-xs">Tudo</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<Wallet className="h-4 w-4" />}
          label="Faturamento aprovado"
          value={BRL(revenue)}
          hint={`${approved.length} orçamento${approved.length === 1 ? "" : "s"}`}
          accent="primary"
        />
        <KpiCard
          icon={<Target className="h-4 w-4" />}
          label="Ticket médio"
          value={BRL(ticket)}
          hint="por aprovado"
          accent="accent"
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Taxa de aprovação"
          value={`${approvalRate.toFixed(0)}%`}
          hint={`${approved.length}/${considered} considerados`}
          accent="success"
        />
        <KpiCard
          icon={<Repeat className="h-4 w-4" />}
          label="Recorrente mensal"
          value={BRL(recurring)}
          hint={`${clients.filter((c) => c.active).length} cliente${
            clients.filter((c) => c.active).length === 1 ? "" : "s"
          }`}
          accent="warning"
        />
      </div>

      {/* Faturamento mensal */}
      <Card className="glass border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display tracking-tight">
            Faturamento mensal
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            6 meses reais + projeção (média 3M + recorrente)
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              total: { label: "Aprovado", color: "hsl(var(--primary))" },
              projection: { label: "Projeção", color: "hsl(var(--accent))" },
            }}
            className="aspect-[16/9] w-full"
          >
            <ComposedChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                }
                width={40}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) =>
                      value == null ? "" : `${name === "projection" ? "Projeção: " : ""}${BRL(Number(value))}`
                    }
                  />
                }
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                iconType="circle"
              />
              <Bar
                dataKey="total"
                name="Aprovado"
                fill="var(--color-total)"
                radius={[6, 6, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="projection"
                name="Projeção"
                stroke="var(--color-projection)"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={{ r: 3, fill: "var(--color-projection)" }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top tipos de vídeo */}
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display tracking-tight flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warning" /> Top tipos de vídeo
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Por receita aprovada no período
            </p>
          </CardHeader>
          <CardContent>
            {topTypes.length ? (
              <div className="space-y-3">
                {topTypes.map((t, i) => {
                  const max = topTypes[0].total || 1;
                  const pct = (t.total / max) * 100;
                  return (
                    <div key={t.label}>
                      <div className="flex items-baseline justify-between text-sm mb-1">
                        <span className="font-medium truncate">
                          <span className="text-muted-foreground mr-2">
                            #{i + 1}
                          </span>
                          {t.label}
                        </span>
                        <span className="font-mono tabular-nums text-xs">
                          {BRL(t.total)}{" "}
                          <span className="text-muted-foreground">
                            · {t.count}
                          </span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyMini text="Sem aprovações no período." />
            )}
          </CardContent>
        </Card>

        {/* Distribuição por status */}
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display tracking-tight">
              Distribuição por status
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Orçamentos no período
            </p>
          </CardHeader>
          <CardContent>
            {statusDist.length ? (
              <ChartContainer
                config={{ value: { label: "Qtd" } }}
                className="aspect-square max-h-[260px] mx-auto"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={statusDist}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {statusDist.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyMini text="Sem dados no período." />
            )}
            {statusDist.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {statusDist.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tendência de criação */}
      <Card className="glass border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display tracking-tight">
            Volume de orçamentos
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Quantidade criada por mês (todos os status)
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ count: { label: "Orçamentos", color: "hsl(var(--accent))" } }}
            className="aspect-[16/6] w-full"
          >
            <LineChart data={monthlyCount}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={30} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--color-count)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--color-count)" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function useMonthlyCount(quotes: ReturnType<typeof useQuotes>["quotes"]) {
  return useMemo(() => {
    const map = new Map<string, number>();
    const labels: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      labels.push({
        key,
        label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      });
      map.set(key, 0);
    }
    quotes.forEach((q) => {
      const d = new Date(q.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
    });
    return labels.map(({ key, label }) => ({ month: label, count: map.get(key) || 0 }));
  }, [quotes]);
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent: "primary" | "accent" | "success" | "warning";
}) {
  const accentMap: Record<string, string> = {
    primary: "text-primary bg-primary/10 border-primary/20",
    accent: "text-accent bg-accent/10 border-accent/20",
    success: "text-success bg-success/10 border-success/20",
    warning: "text-warning bg-warning/10 border-warning/20",
  };
  return (
    <Card className="glass border-border/50">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg border ${accentMap[accent]}`}
          >
            {icon}
          </span>
        </div>
        <p className="font-display text-xl sm:text-2xl tracking-tight tabular-nums">
          {value}
        </p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="py-8 text-center text-xs text-muted-foreground">{text}</div>
  );
}
