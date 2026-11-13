export const DAILY_HABIT_KEYS = ["book", "sport", "language", "vitamin_c", "vitamin_e", "kk"] as const;

const KNOWN = new Set<string>(DAILY_HABIT_KEYS);

export function habitsLeft(taskKeys: readonly string[]): number {
  const done = new Set<string>();
  for (const key of taskKeys) {
    if (KNOWN.has(key)) done.add(key);
  }
  return DAILY_HABIT_KEYS.length - done.size;
}

export function reminderBody(left: number, untilHm: string): string {
  const mod10 = left % 10;
  const mod100 = left % 100;
  const word =
    mod10 === 1 && mod100 !== 11 ? "привычка" :
    mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "привычки" :
    "привычек";
  const verb = word === "привычка" ? "осталась" : "осталось";
  return `Сегодня ${verb} ${left} ${word} — до полуночи ${untilHm}`;
}
