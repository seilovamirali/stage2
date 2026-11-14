import { useEffect, useState } from "react";
import { countdownTone, formatCountdown, secondsUntilAlmatyMidnight } from "@/lib/countdown";

const TONE_CLASS = {
  green: "bg-[#1d7a45]",
  orange: "bg-[#c2410c]",
  red: "countdown-alert bg-[#b42318]",
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
    <p className={`rounded-full px-5 py-3.5 text-center text-base font-bold tabular-nums text-white ${TONE_CLASS[tone]}`} aria-live="polite">
      До конца дня: {formatCountdown(seconds)}
    </p>
  );
}
