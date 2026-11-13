import { useEffect, useState } from "react";
import { formatCountdown, secondsUntilAlmatyMidnight } from "@/lib/countdown";

export function DayCountdown() {
  const [label, setLabel] = useState(() => formatCountdown(secondsUntilAlmatyMidnight()));
  useEffect(() => {
    const tick = () => setLabel(formatCountdown(secondsUntilAlmatyMidnight()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <p className="border border-border bg-card px-4 py-3 text-sm font-semibold tabular-nums" aria-live="polite">
      До конца дня: {label}
    </p>
  );
}
