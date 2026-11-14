import { useEffect, useState } from "react";
import { tierBand, VEHICLE_TIERS, vehicleTier } from "@/lib/atomic";
import { Vehicle } from "@/components/Vehicles";

export { Vehicle };

export interface Racer {
  id: string;
  name: string;
  emoji: string;
  pct: number;
  position: number;
  points: number;
  debt: number;
  isMe?: boolean;
}

export function Trophy({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M7 4 h10 v3 a5 5 0 0 1-10 0z" className="fill-gold" />
      <path d="M7 6 H4 a4 4 0 0 0 4 5 M17 6 h3 a4 4 0 0 1-4 5" fill="none" className="stroke-gold" strokeWidth="1.6" />
      <path d="M12 12 v3 M9 20 h6 M10 15 h4 v2 H10z" className="stroke-foreground" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

function Checkered({ className = "" }: { className?: string }) {
  return <span className={`checkered block h-full w-6 ${className}`} aria-hidden />;
}

export function RaceLane({ racer, leader, go }: { racer: Racer; leader: boolean; go: boolean }) {
  const tier = vehicleTier(racer.pct);
  const travel = Math.max(0, Math.min(100, racer.position)) * 0.7;
  return (
    <div className={`rounded-2xl border px-3 py-3 ${racer.isMe ? "border-gold bg-gold-soft/40" : "border-border bg-card"}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm">
          <span className="mr-1 font-semibold tabular-nums">{racer.emoji}</span>
          <span className="font-semibold">{racer.name}</span>
          {leader && <Trophy className="ml-1 inline size-4 align-text-bottom" />}
        </p>
        <p className="shrink-0 text-right text-xs font-semibold">
          {tier.name} · темп {racer.pct}%
          {racer.debt > 0 ? ` · штраф −${racer.debt}` : ""}
        </p>
      </div>
      <div className="relative mt-3 h-20 overflow-hidden rounded-full border border-foreground/10 bg-background" aria-hidden>
        <span className="absolute left-3 right-10 top-1/2 border-t border-dashed border-foreground/20" />
        <span className="absolute inset-y-0 right-0">
          <Checkered />
        </span>
        <span className="race-vehicle absolute inset-y-0 flex items-center" style={{ left: go ? `${travel}%` : "0%" }}>
          <Vehicle kind={tier.id} className="h-14 w-[6.5rem]" />
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{racer.points} оч.</p>
    </div>
  );
}

export function RaceTrack({ racers, motionKey }: { racers: Racer[]; motionKey: string }) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    setGo(false);
    const timer = window.setTimeout(() => setGo(true), 40);
    return () => window.clearTimeout(timer);
  }, [motionKey]);
  if (racers.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">На трассе пока пусто.</p>;
  }
  return (
    <ol className="space-y-3" aria-label="Трасса">
      {racers.map((racer, index) => (
        <li key={racer.id} aria-label={`${index + 1}. ${racer.name}, ${racer.pct} процентов, ${vehicleTier(racer.pct).name}`}>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <span>{index + 1}</span>
            {index === 0 && <span className="text-gold">Лидер</span>}
          </div>
          <RaceLane racer={racer} leader={index === 0} go={go} />
        </li>
      ))}
    </ol>
  );
}

export function MyRaceCard({
  month,
  daysLeftText,
  pace,
  position,
  positionDays,
  daysInMonth,
  debt,
  doubled,
  planned,
  points,
  place,
  total,
  phrase,
  leader,
}: {
  month: string;
  daysLeftText: string;
  pace: number;
  position: number;
  positionDays: number;
  daysInMonth: number;
  debt: number;
  doubled: number;
  planned: number;
  points: number;
  place: number;
  total: number;
  phrase: string;
  leader: boolean;
}) {
  const tier = vehicleTier(pace);
  const travel = Math.max(0, Math.min(100, position)) * 0.7;
  return (
    <section className="border border-border bg-card px-4 py-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">{month}</p>
          <h2 className="font-display mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight">
            {tier.name}
            {leader && <Trophy className="size-5" />}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{daysLeftText}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {points} оч. · темп {pace}% · место {place} из {total}
          </p>
        </div>
        <Vehicle kind={tier.id} className="h-16 w-[7.5rem] shrink-0" />
      </div>
      <div className="relative mt-4 h-20 overflow-hidden rounded-full border border-foreground/10 bg-background" aria-hidden>
        <span className="absolute left-3 right-10 top-1/2 border-t border-dashed border-foreground/20" />
        <span className="absolute inset-y-0 right-0"><span className="checkered block h-full w-6" /></span>
        <span className="race-vehicle absolute inset-y-0 flex items-center" style={{ left: `${travel}%` }}>
          <Vehicle kind={tier.id} className="h-14 w-[6.5rem]" />
        </span>
      </div>
      {debt > 0 && (
        <div className="mt-3 border border-gold bg-gold-soft px-3 py-2 text-sm">
          <p className="font-semibold">Штрафов нет</p>
          <p className="mt-1">Одно задание — одно очко</p>
          <p className="mt-1 text-muted-foreground">{doubled} из {planned} привычек удвоены</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
            <div className="h-full bg-gold" style={{ width: `${planned === 0 ? 0 : Math.round((doubled / planned) * 100)}%` }} />
          </div>
        </div>
      )}
      <p className="mt-3 text-sm font-medium">{phrase}</p>
    </section>
  );
}

export function RaceRules() {
  return (
    <section className="border border-border bg-card px-4 py-4 text-sm leading-relaxed">
      <h2 className="font-display text-lg font-bold">Правила гонки</h2>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
        <li>Привычки у всех одни: книга, спорт, иностранный язык, витамин C, витамин E и КК.</li>
        <li>Одно выполненное задание — одно очко. Штрафов нет.</li>
        <li>Трасса — календарный месяц, с 1-го числа до последнего. Место на треке — набранные очки.</li>
        <li>Техника зависит от процента закрытых заданий: от пешком до ракеты. В новом месяце счёт начинается сначала.</li>
      </ul>
    </section>
  );
}

export function VehicleLegend() {
  const tiers = [...VEHICLE_TIERS].sort((a, b) => a.min - b.min);
  return (
    <section className="border border-border bg-card px-4 py-4" aria-label="Легенда техники">
      <h2 className="font-display text-lg font-bold">Техника</h2>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {tiers.map((tier) => {
          const band = tierBand(tier);
          return (
            <li key={tier.id} className="flex items-center gap-2 border border-foreground/10 px-2 py-1.5">
              <Vehicle kind={tier.id} className="h-9 w-[4.2rem] shrink-0" />
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold">{tier.name}</span>
                <span className="block text-[11px] tabular-nums text-muted-foreground">{band.from}–{band.to}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function RaceHistory({ days }: { days: { date: string; status: string; delta: number }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1" aria-label="История месяца">
      {days.map((day) => (
        <span
          key={day.date}
          title={`${day.date}: ${day.status}`}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
            day.status === "double" ? "border-foreground bg-foreground text-background" :
            day.status === "done" || day.status === "free" ? "border-gold bg-gold text-gold-foreground" :
            day.status === "miss" ? "border-gold text-gold" :
            day.status === "pending" ? "border-foreground" :
            "border-foreground/10 text-muted-foreground"
          }`}
        >
          {day.status === "miss" ? "·" : day.date.slice(8)}
        </span>
      ))}
    </div>
  );
}
