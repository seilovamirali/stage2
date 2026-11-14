import { useEffect, useState } from "react";
import { countdownTone, formatCountdown, secondsUntilAlmatyMidnight } from "@/lib/countdown";

const TONE_CLASS = {
  green: "text-[#1d7a45]",
  orange: "text-gold",
  red: "countdown-alert text-[#b42318]",
} as const;

export function DayCountdown() {
  const [seconds, setSeconds] = useState(() => secondsUntilAlmatyMidnight());
  useEffect(() => {
    const tick = () => setSeconds(secondsUntilAlmatyMidnight());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  const tone = countdownTone(seconds);
  return (
    <p className={`border border-border bg-card px-4 py-3 text-sm font-semibold tabular-nums ${TONE_CLASS[tone]}`} aria-live="polite">
      До конца дня: {formatCountdown(seconds)}
    </p>
  );
}
