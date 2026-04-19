import { useMemo, useState } from "react";
import { Delivery, FixedClient, STATUS_META } from "@/hooks/useFixedClients";
import { clientColor } from "@/lib/clientColors";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, DollarSign } from "lucide-react";

// Cor especial para entregas oriundas de orçamento aprovado
const QUOTE_COLOR = {
  bg: "hsl(45 90% 55% / 0.18)",
  fg: "hsl(45 90% 35%)",
  border: "hsl(45 90% 55% / 0.55)",
  dot: "hsl(45 90% 55%)",
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function ymd(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function buildMonthGrid(year: number, month: number) {
  // month is 0-indexed
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay(); // 0 = Sun
  const start = new Date(year, month, 1 - startWeekday);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return days;
}

export default function CalendarView({
  clients,
  deliveries,
  onCreateAt,
  onOpenDelivery,
}: {
  clients: FixedClient[];
  deliveries: Delivery[];
  onCreateAt: (defaults: Partial<Delivery>) => void;
  onOpenDelivery: (delivery: Delivery) => void;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const days = useMemo(
    () => buildMonthGrid(cursor.year, cursor.month),
    [cursor]
  );

  // Index deliveries by ymd date (uses recording_at first, falls back to delivery_date)
  const byDay = useMemo(() => {
    const map = new Map<string, Delivery[]>();
    deliveries.forEach((d) => {
      const ref = d.recording_at
        ? new Date(d.recording_at)
        : d.delivery_date
        ? new Date(d.delivery_date + "T00:00:00")
        : null;
      if (!ref) return;
      const key = ymd(ref);
      const arr = map.get(key) || [];
      arr.push(d);
      map.set(key, arr);
    });
    return map;
  }, [deliveries]);

  // KPIs do mês
  const monthStats = useMemo(() => {
    const inMonth = deliveries.filter(
      (d) =>
        d.cycle_year === cursor.year && d.cycle_month === cursor.month + 1
    );
    return {
      total: inMonth.length,
      delivered: inMonth.filter((d) => d.status === "delivered").length,
      posted: inMonth.filter((d) => d.status === "posted").length,
      scheduled: inMonth.filter((d) => d.status === "scheduled").length,
    };
  }, [deliveries, cursor]);

  const prev = () =>
    setCursor((c) =>
      c.month === 0
        ? { year: c.year - 1, month: 11 }
        : { year: c.year, month: c.month - 1 }
    );
  const next = () =>
    setCursor((c) =>
      c.month === 11
        ? { year: c.year + 1, month: 0 }
        : { year: c.year, month: c.month + 1 }
    );
  const goToday = () =>
    setCursor({ year: today.getFullYear(), month: today.getMonth() });

  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients]
  );

  const todayKey = ymd(today);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base sm:text-lg tracking-tight">
            {MONTHS[cursor.month]}{" "}
            <span className="text-muted-foreground">{cursor.year}</span>
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={prev} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToday}
            className="h-8 text-xs"
          >
            Hoje
          </Button>
          <Button variant="ghost" size="icon" onClick={next} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs do mês */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <Stat label="Agendadas" value={monthStats.scheduled} tone="muted" />
        <Stat label="Total" value={monthStats.total} tone="primary" />
        <Stat label="Entregues" value={monthStats.delivered} tone="success" />
        <Stat label="Postadas" value={monthStats.posted} tone="accent" />
      </div>

      {/* Legenda de clientes */}
      {clients.length > 0 && (
        <div className="glass rounded-xl p-2.5 flex flex-wrap gap-x-3 gap-y-1.5">
          {clients.slice(0, 12).map((c) => {
            const col = clientColor(c.id);
            return (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 text-[11px]"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: col.dot }}
                />
                <span className="text-muted-foreground truncate max-w-[140px]">
                  {c.name}
                </span>
              </span>
            );
          })}
          {clients.length > 12 && (
            <span className="text-[11px] text-muted-foreground">
              +{clients.length - 12} outros
            </span>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="glass rounded-2xl p-2 sm:p-3">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="text-[10px] uppercase tracking-wider text-muted-foreground text-center py-1"
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const key = ymd(d);
            const inMonth = d.getMonth() === cursor.month;
            const isToday = key === todayKey;
            const items = byDay.get(key) || [];
            return (
              <DayCell
                key={key}
                date={d}
                inMonth={inMonth}
                isToday={isToday}
                items={items}
                clientMap={clientMap}
                onCreateAt={() =>
                  onCreateAt({
                    recording_at: new Date(
                      d.getFullYear(),
                      d.getMonth(),
                      d.getDate(),
                      10,
                      0
                    ).toISOString(),
                  })
                }
                onOpenDelivery={onOpenDelivery}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

const TONES: Record<string, string> = {
  muted: "bg-muted/60 text-muted-foreground",
  primary: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  accent: "bg-accent/15 text-accent",
  warning: "bg-warning/15 text-warning",
};

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="glass rounded-xl py-2 px-1.5">
      <p
        className={`font-display text-lg tabular-nums inline-block px-2 rounded-md ${TONES[tone]}`}
      >
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
        {label}
      </p>
    </div>
  );
}

function DayCell({
  date,
  inMonth,
  isToday,
  items,
  clientMap,
  onCreateAt,
  onOpenDelivery,
}: {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  items: Delivery[];
  clientMap: Map<string, FixedClient>;
  onCreateAt: () => void;
  onOpenDelivery: (d: Delivery) => void;
}) {
  const [open, setOpen] = useState(false);
  const visible = items.slice(0, 3);
  const more = items.length - visible.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`group relative flex flex-col gap-1 min-h-[64px] sm:min-h-[88px] rounded-lg p-1 sm:p-1.5 text-left border transition-colors
            ${inMonth ? "border-border/40 hover:border-border bg-card/30" : "border-transparent opacity-40 hover:opacity-70"}
            ${isToday ? "ring-1 ring-primary border-primary/40" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] sm:text-xs tabular-nums ${
                isToday
                  ? "font-bold text-primary"
                  : inMonth
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {date.getDate()}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 flex-1">
            {visible.map((d) => {
              const c = clientMap.get(d.fixed_client_id);
              const col = c ? clientColor(c.id) : null;
              return (
                <span
                  key={d.id}
                  className="text-[9px] sm:text-[10px] leading-tight px-1 py-0.5 rounded truncate border"
                  style={
                    col
                      ? {
                          background: col.bg,
                          color: col.fg,
                          borderColor: col.border,
                        }
                      : undefined
                  }
                  title={`${c?.name || ""} · ${d.title || "Sem título"} · ${STATUS_META[d.status].label}`}
                >
                  {d.title || c?.name || "Entrega"}
                </span>
              );
            })}
            {more > 0 && (
              <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                +{more} mais
              </span>
            )}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="flex items-center justify-between mb-2">
          <p className="font-display text-sm">
            {date.toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setOpen(false);
              onCreateAt();
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">
            Nenhuma entrega agendada.
          </p>
        ) : (
          <ul className="space-y-1.5 max-h-72 overflow-auto">
            {items.map((d) => {
              const c = clientMap.get(d.fixed_client_id);
              const col = c ? clientColor(c.id) : null;
              return (
                <li key={d.id}>
                  <button
                    onClick={() => {
                      setOpen(false);
                      onOpenDelivery(d);
                    }}
                    className="w-full text-left rounded-md p-2 border hover:bg-muted/40 transition-colors"
                    style={col ? { borderColor: col.border } : undefined}
                  >
                    <div className="flex items-center gap-2">
                      {col && (
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ background: col.dot }}
                        />
                      )}
                      <span className="text-xs font-medium truncate flex-1">
                        {d.title || "Sem título"}
                      </span>
                      <span className="text-[9px] uppercase text-muted-foreground">
                        {STATUS_META[d.status].label}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {c?.name}
                      {d.recording_at &&
                        " · " +
                          new Date(d.recording_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
