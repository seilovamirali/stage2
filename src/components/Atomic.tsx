import { useEffect, useState } from "react";
import type { CompoundPoint, DotState, Law } from "@/lib/atomic";
import { defaultIdentity } from "@/lib/atomic";
import { loadIdentity, saveIdentity } from "@/lib/identity";

export function AtomMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="2.2" className="fill-gold" />
      <ellipse cx="16" cy="16" rx="12" ry="5" fill="none" className="stroke-foreground" strokeWidth="1.2" />
      <ellipse cx="16" cy="16" rx="12" ry="5" fill="none" className="stroke-foreground" strokeWidth="1.2" transform="rotate(60 16 16)" />
      <ellipse cx="16" cy="16" rx="12" ry="5" fill="none" className="stroke-foreground" strokeWidth="1.2" transform="rotate(120 16 16)" />
    </svg>
  );
}

export function CompoundChart({ points, compact = false }: { points: CompoundPoint[]; compact?: boolean }) {
  if (points.length < 2) return null;
  const width = 320;
  const height = compact ? 46 : 112;
  const pad = compact ? 4 : 8;
  const max = Math.max(...points.map((point) => point.ideal), 1.01);
  const x = (index: number) => pad + (index / (points.length - 1)) * (width - pad * 2);
  const y = (value: number) => height - pad - ((value - 1) / (max - 1)) * (height - pad * 2);
  const path = (key: "actual" | "ideal") => points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)} ${y(point[key]).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  if (!last) return null;
  const gain = Math.round((last.actual - 1) * 100);
  const end = { x: x(points.length - 1), y: y(last.actual) };
  return (
    <figure className={compact ? "" : "space-y-2"}>
      {!compact && (
        <figcaption className="flex items-baseline justify-between gap-3">
          <span className="font-display text-xl font-bold tracking-tight">1% лучше каждый день</span>
          <span className="text-sm font-semibold text-gold">+{gain}%</span>
        </figcaption>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" role="img" aria-label={`Кривая роста, плюс ${gain} процентов`}>
        <path d={path("ideal")} fill="none" stroke="currentColor" strokeOpacity="0.28" strokeDasharray="3 4" strokeWidth="1.4" />
        <path d={path("actual")} fill="none" className="stroke-gold" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={end.x} cy={end.y} r={compact ? 2.4 : 3.4} className="fill-gold" />
      </svg>
      {!compact && <p className="text-xs leading-relaxed text-muted-foreground">Пунктир — если становиться лучше на 1% каждый день. Сплошная линия — ваш темп.</p>}
    </figure>
  );
}

export function ChainGrid({ dots }: { dots: { date: string; state: DotState }[] }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold tracking-tight">Не разрывай цепочку</h2>
      <div className="mt-4 grid grid-cols-7 gap-x-2 gap-y-3">
        {dots.map((dot) => (
          <span
            key={dot.date}
            title={dot.date}
            className={`mx-auto block size-3.5 rounded-full border ${
              dot.state === "full"
                ? "border-gold bg-gold"
                : dot.state === "partial"
                  ? "border-gold bg-gold/35"
                  : "border-foreground/20 bg-transparent"
            } ${dot.date === dots[dots.length - 1]?.date ? "ring-2 ring-gold/40 ring-offset-2 ring-offset-background" : ""}`}
          />
        ))}
      </div>
    </section>
  );
}

export function HabitDots({ dots }: { dots: { date: string; on: boolean }[] }) {
  return (
    <div className="flex gap-1.5" aria-hidden>
      {dots.map((dot) => (
        <span key={dot.date} title={dot.date} className={`size-2 rounded-full ${dot.on ? "bg-gold" : "border border-foreground/20"}`} />
      ))}
    </div>
  );
}

export function FourLawsCard({ law }: { law: Law }) {
  return (
    <section className="border border-border border-l-[3px] border-l-gold bg-card px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">{law.kicker}</p>
      <h2 className="font-display mt-2 text-lg font-bold tracking-tight">{law.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{law.body}</p>
    </section>
  );
}

export function IdentityField({ userId, habitKey, habitTitle }: { userId: string | undefined; habitKey: string; habitTitle: string }) {
  const [value, setValue] = useState(() => defaultIdentity({ key: habitKey, title: habitTitle }));
  useEffect(() => {
    setValue(loadIdentity(userId, habitKey, habitTitle));
    const sync = () => setValue(loadIdentity(userId, habitKey, habitTitle));
    window.addEventListener("stage2-identity", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("stage2-identity", sync);
      window.removeEventListener("storage", sync);
    };
  }, [userId, habitKey, habitTitle]);
  return (
    <textarea
      aria-label={`Фраза про себя для привычки ${habitTitle}`}
      value={value}
      maxLength={120}
      rows={2}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => setValue(saveIdentity(userId, habitKey, habitTitle, value))}
      className="mt-1 w-full resize-none border-b border-transparent bg-transparent text-sm italic leading-snug text-muted-foreground outline-none focus:border-gold"
    />
  );
}

export function CheckOrb({ done, burst }: { done: boolean; burst: boolean }) {
  return (
    <span className={`relative flex size-11 shrink-0 items-center justify-center rounded-full border ${done ? "border-gold bg-gold text-gold-foreground" : "border-foreground/15 bg-card"} ${burst ? "animate-check" : ""}`}>
      {burst && <span className="atom-ring" />}
      {done ? <span className="text-lg font-bold leading-none">✓</span> : <span className="size-1.5 rounded-full bg-foreground/30" />}
    </span>
  );
}
