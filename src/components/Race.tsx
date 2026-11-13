import { useEffect, useState } from "react";
import { vehicleTier, type VehicleId } from "@/lib/atomic";

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

export function Vehicle({ kind, className = "h-12 w-20" }: { kind: VehicleId; className?: string }) {
  return (
    <svg viewBox="0 0 96 64" className={`block overflow-visible ${className}`} aria-hidden>
      {kind === "walk" && <Walker />}
      {kind === "bike" && <Bicycle />}
      {kind === "moped" && <Moped />}
      {kind === "sedan" && <Sedan />}
      {kind === "sport" && <SportCar />}
      {kind === "gt" && <GtTurbo />}
    </svg>
  );
}

function Wheel({ cx, cy, r = 5, hot = false }: { cx: number; cy: number; r?: number; hot?: boolean }) {
  return <circle cx={cx} cy={cy} r={r} className={hot ? "fill-gold" : "fill-foreground"} />;
}

function Walker() {
  return (
    <g transform="translate(0 4)" className="stroke-foreground" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="48" cy="16" r="5.5" className="fill-foreground" />
      <path d="M48 22 v12 M40 28 h16 M48 34 l-7 14 M48 34 l7 14" />
    </g>
  );
}

function Bicycle() {
  return (
    <g transform="translate(0 -2)" fill="none" className="stroke-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="28" cy="44" r="8" />
      <circle cx="70" cy="44" r="8" />
      <path d="M28 44 H46 L58 24 L70 44 H46 L40 24" />
      <path d="M40 24 h16" className="stroke-gold" />
      <circle cx="52" cy="20" r="3.2" className="fill-foreground stroke-none" />
    </g>
  );
}

function Moped() {
  return (
    <g transform="translate(0 -4)" className="stroke-foreground" fill="none" strokeWidth="2" strokeLinejoin="round">
      <circle cx="28" cy="46" r="7" />
      <circle cx="72" cy="46" r="7" />
      <path d="M28 46 h16 l8-14 h16 l6 14" />
      <path d="M50 32 h12" className="stroke-gold" />
      <circle cx="58" cy="22" r="3.4" className="fill-foreground stroke-none" />
      <circle cx="78" cy="30" r="2" className="fill-gold stroke-none" />
    </g>
  );
}

function Sedan() {
  return (
    <g transform="translate(0 -2)">
      <path d="M12 44 h68 a4 4 0 0 0 4-4 v-5 H20 l8-10 h26 l10 10 h16 v5 a2 2 0 0 1-2 2" className="fill-foreground" />
      <path d="M30 30 h20 l6 8 H24z" className="fill-background" />
      <circle cx="46" cy="20" r="3.2" className="fill-foreground" />
      <Wheel cx={30} cy={46} />
      <Wheel cx={70} cy={46} />
    </g>
  );
}

function SportCar() {
  return (
    <g transform="translate(0 -3)">
      <path d="M8 46 h80 l-4-9 H42 l-8-8 H24 l-6 8 H10z" className="fill-foreground" />
      <path d="M38 31 h16 l6 7 H32z" className="fill-gold" />
      <circle cx="50" cy="22" r="3.2" className="fill-foreground" />
      <Wheel cx={26} cy={47} hot />
      <Wheel cx={74} cy={47} hot />
    </g>
  );
}

function GtTurbo() {
  return (
    <g transform="translate(0 -3)">
      <path d="M6 46 h84 l-2-7 H60 l-6-9 H26 L18 39 H8z" className="fill-foreground" />
      <path d="M60 30 h16 v4 H64z" className="fill-foreground" />
      <path d="M30 36 h18 l5 6 H26z" className="fill-gold" />
      <circle cx="48" cy="20" r="3.2" className="fill-foreground" />
      <Wheel cx={24} cy={48} r={5.5} hot />
      <Wheel cx={76} cy={48} r={5.5} hot />
    </g>
  );
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
          <Vehicle kind={tier.id} className="h-14 w-[5.25rem]" />
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
        <Vehicle kind={tier.id} className="h-16 w-28 shrink-0" />
      </div>
      <div className="relative mt-4 h-20 overflow-hidden rounded-full border border-foreground/10 bg-background" aria-hidden>
        <span className="absolute left-3 right-10 top-1/2 border-t border-dashed border-foreground/20" />
        <span className="absolute inset-y-0 right-0"><span className="checkered block h-full w-6" /></span>
        <span className="race-vehicle absolute inset-y-0 flex items-center" style={{ left: `${travel}%` }}>
          <Vehicle kind={tier.id} className="h-14 w-[5.25rem]" />
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
        <li>Машина зависит от процента закрытых заданий. В новом месяце счёт начинается сначала.</li>
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
