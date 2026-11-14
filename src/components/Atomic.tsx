import { useEffect, useState } from "react";
import type { Law } from "@/lib/atomic";
import { defaultIdentity } from "@/lib/atomic";
import { loadIdentity, saveIdentity } from "@/lib/identity";

export function AtomMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M8.2 5.2h15.6v2.4c0 5-3.1 8.6-7.8 9-4.7-.4-7.8-4-7.8-9V5.2z" className="fill-gold" />
      <path d="M11.2 7.4c2.2 1.2 7.4 1.2 9.6 0" fill="none" className="stroke-background" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M8.2 8H5.2a3.8 3.8 0 0 0 3.8 4.6" fill="none" className="stroke-gold" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M23.8 8h3a3.8 3.8 0 0 1-3.8 4.6" fill="none" className="stroke-gold" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 16.6v3.2" className="stroke-foreground" strokeWidth="2" strokeLinecap="round" />
      <path d="M12.4 20.2h7.2v2.2h-7.2z" className="fill-foreground" />
      <path d="M10 24.6h12" className="stroke-foreground" strokeWidth="2.2" strokeLinecap="round" />
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
