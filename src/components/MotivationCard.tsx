import { dailySpeech } from "@/lib/motivation";

export function MotivationCard({ today, remaining }: { today: string; remaining: number }) {
  return (
    <p className="border-l-[3px] border-gold pl-3 text-base font-semibold leading-snug">
      {dailySpeech(today, remaining)}
    </p>
  );
}
