import { useEffect, useState } from "react";
import type { Law } from "@/lib/atomic";
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
