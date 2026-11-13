import { motivationForDate } from "@/lib/motivation";

export function MotivationCard({ today }: { today: string }) {
  return (
    <section className="border border-border border-l-[3px] border-l-gold bg-card px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">На сегодня</p>
      <p className="mt-2 text-base leading-relaxed">{motivationForDate(today)}</p>
    </section>
  );
}
