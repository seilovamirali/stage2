export function almatyClock(now: Date = new Date()): { hour: number; minute: number; second: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Almaty",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  return { hour: read("hour"), minute: read("minute"), second: read("second") };
}

export function secondsUntilAlmatyMidnight(now: Date = new Date()): number {
  const { hour, minute, second } = almatyClock(now);
  return 24 * 3600 - (hour * 3600 + minute * 60 + second);
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const hour = Math.floor(safe / 3600);
  const minute = Math.floor((safe % 3600) / 60);
  const second = safe % 60;
  return [hour, minute, second].map((part) => String(part).padStart(2, "0")).join(":");
}
