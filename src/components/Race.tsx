import { useEffect, useState } from "react";
import { vehicleTier, type VehicleId } from "@/lib/atomic";

export interface Racer {
  id: string;
  name: string;
  emoji: string;
  pct: number;
  points: number;
  isMe?: boolean;
}

export function Vehicle({ kind, className = "h-9 w-16" }: { kind: VehicleId; className?: string }) {
  return (
    <svg viewBox="0 0 96 44" className={className} aria-hidden>
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
    <g className="fill-foreground" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="34" cy="10" r="4" fill="currentColor" />
      <path d="M34 15 v9 M28 34 l6-8 6 8 M27 20 h12" fill="none" />
    </g>
  );
}

function Bicycle() {
  return (
    <g fill="none" className="stroke-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="32" r="7" />
      <circle cx="68" cy="32" r="7" />
      <path d="M24 32 L42 32 L56 16 L68 32 L42 32 L36 16" />
      <path d="M36 16 h14" className="stroke-gold" />
    </g>
  );
}

function Moped() {
  return (
    <g className="stroke-foreground" fill="none" strokeWidth="2" strokeLinejoin="round">
      <circle cx="26" cy="33" r="6" />
      <circle cx="72" cy="33" r="6" />
      <path d="M26 33 h18 l8-12 h16 l6 12" />
      <path d="M48 21 h10" className="stroke-gold" />
      <circle cx="78" cy="18" r="2" className="fill-gold stroke-none" />
    </g>
  );
}

function Sedan() {
  return (
    <g>
      <path d="M10 30 h70 a4 4 0 0 0 4-4 v-4 H18 l8-8 h28 l10 8 h12 v8 a2 2 0 0 1-2 2" className="fill-foreground" />
      <path d="M28 22 h22 l6 6 H22z" className="fill-background" />
      <Wheel cx={28} cy={32} />
      <Wheel cx={70} cy={32} />
    </g>
  );
}

function SportCar() {
  return (
    <g>
      <path d="M8 32 h78 l-4-8 H40 l-8-7 H22 l-6 7 H10z" className="fill-foreground" />
      <path d="M36 20 h16 l6 6 H30z" className="fill-gold" />
      <Wheel cx={26} cy={33} hot />
      <Wheel cx={72} cy={33} hot />
    </g>
  );
}

function GtTurbo() {
  return (
    <g>
      <path d="M6 31 h84 l-2-6 H58 l-6-8 H24 L16 25 H8z" className="fill-foreground" />
      <path d="M58 17 h16 v4 H62z" className="fill-foreground" />
      <path d="M28 22 h18 l5 5 H24z" className="fill-gold" />
      <Wheel cx={24} cy={33} r={5.5} hot />
      <Wheel cx={74} cy={33} r={5.5} hot />
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
  const travel = Math.max(0, Math.min(100, racer.pct)) * 0.7;
  return (
    <div className={`rounded-2xl border px-3 py-3 ${racer.isMe ? "border-gold bg-gold-soft/40" : "border-border bg-card"}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm">
          <span className="mr-1 font-semibold tabular-nums">{racer.emoji}</span>
          <span className="font-semibold">{racer.name}</span>
          {leader && <Trophy className="ml-1 inline size-4 align-text-bottom" />}
        </p>
        <p className="shrink-0 text-right text-xs font-semibold">
          {racer.pct}% · {tier.name}
        </p>
      </div>
      <div className="relative mt-3 h-12 overflow-hidden rounded-full border border-foreground/10 bg-background" aria-hidden>
        <span className="absolute left-3 right-10 top-1/2 border-t border-dashed border-foreground/20" />
        <span className="absolute inset-y-0 right-0">
          <Checkered />
        </span>
        <span className="race-vehicle absolute top-1/2" style={{ left: go ? `${travel}%` : "0%" }}>
          <span className="race-bob block -translate-y-1/2">
            <Vehicle kind={tier.id} />
          </span>
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
  pct,
  points,
  place,
  total,
  phrase,
  leader,
}: {
  pct: number;
  points: number;
  place: number;
  total: number;
  phrase: string;
  leader: boolean;
}) {
  const tier = vehicleTier(pct);
  const travel = Math.max(0, Math.min(100, pct)) * 0.7;
  return (
    <section className="border border-border bg-card px-4 py-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Гонка недели</p>
          <h2 className="font-display mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight">
            {tier.name}
            {leader && <Trophy className="size-5" />}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {pct}% · {points} оч. · место {place} из {total}
          </p>
        </div>
        <Vehicle kind={tier.id} className="h-14 w-24 shrink-0" />
      </div>
      <div className="relative mt-4 h-12 overflow-hidden rounded-full border border-foreground/10 bg-background" aria-hidden>
        <span className="absolute left-3 right-10 top-1/2 border-t border-dashed border-foreground/20" />
        <span className="absolute inset-y-0 right-0"><span className="checkered block h-full w-6" /></span>
        <span className="race-vehicle absolute top-1/2" style={{ left: `${travel}%` }}>
          <span className="race-bob block -translate-y-1/2">
            <Vehicle kind={tier.id} />
          </span>
        </span>
      </div>
      <p className="mt-3 text-sm font-medium">{phrase}</p>
    </section>
  );
}
