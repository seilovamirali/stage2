import {
  activeDaily,
  activeWeekly,
  addDays,
  diffDays,
  weeksTouched,
  type Completion,
  type TaskDef,
} from "@/lib/habits";

export const FOUR_LAWS = [
  {
    key: "obvious",
    kicker: "Закон 1 · очевидный",
    title: "Сделай привычку заметной",
    body: "Положи книгу на видное место, а форму — у двери. То, что попадается на глаза, легче начать.",
  },
  {
    key: "attractive",
    kicker: "Закон 2 · привлекательный",
    title: "Сделай её желанной",
    body: "Соедини чтение или тренировку с тем, что уже нравится: чай, любимый плейлист, прогулка после.",
  },
  {
    key: "easy",
    kicker: "Закон 3 · лёгкий",
    title: "Сделай первый шаг крошечным",
    body: "Две страницы или десять минут тоже считаются. Начать проще, чем ждать идеального настроя.",
  },
  {
    key: "satisfying",
    kicker: "Закон 4 · приятный",
    title: "Сделай финиш приятным",
    body: "Отметь галочку сразу. Видимая победа — маленькая награда, после которой хочется вернуться завтра.",
  },
] as const;

export type Law = (typeof FOUR_LAWS)[number];

export function lawForDate(date: string): Law {
  const year = Number(date.slice(0, 4)) || 0;
  const month = Number(date.slice(5, 7)) || 0;
  const day = Number(date.slice(8, 10)) || 0;
  const index = Math.abs((year * 366 + month * 31 + day) % FOUR_LAWS.length);
  return (FOUR_LAWS[index] ?? FOUR_LAWS[0]) as Law;
}

export interface CompoundPoint {
  date: string;
  actual: number;
  ideal: number;
}

export function compoundSeries(
  list: readonly Completion[],
  today: string,
  tasks: readonly TaskDef[],
  days = 28,
): CompoundPoint[] {
  const daily = activeDaily(tasks);
  const keys = new Set(daily.map((task) => task.key));
  const count = daily.length;
  const start = addDays(today, -(days - 1));
  const byDay = new Map<string, number>();
  for (const row of list) {
    if (!keys.has(row.task_key) || row.completed_on < start || row.completed_on > today) continue;
    byDay.set(row.completed_on, (byDay.get(row.completed_on) ?? 0) + 1);
  }
  const points: CompoundPoint[] = [];
  let actual = 1;
  let ideal = 1;
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    const ratio = count === 0 ? 0 : Math.min(1, (byDay.get(date) ?? 0) / count);
    actual *= 1 + 0.01 * ratio;
    ideal *= 1.01;
    points.push({ date, actual, ideal });
  }
  return points;
}

export type DotState = "empty" | "partial" | "full";

export function dayChain(
  list: readonly Completion[],
  today: string,
  tasks: readonly TaskDef[],
  days = 28,
): { date: string; state: DotState }[] {
  const daily = activeDaily(tasks);
  const keys = new Set(daily.map((task) => task.key));
  const start = addDays(today, -(days - 1));
  const byDay = new Map<string, number>();
  for (const row of list) {
    if (!keys.has(row.task_key) || row.completed_on < start || row.completed_on > today) continue;
    byDay.set(row.completed_on, (byDay.get(row.completed_on) ?? 0) + 1);
  }
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(start, index);
    const done = byDay.get(date) ?? 0;
    const state: DotState = daily.length === 0 || done <= 0 ? "empty" : done >= daily.length ? "full" : "partial";
    return { date, state };
  });
}

export function habitChain(
  list: readonly Completion[],
  habitKey: string,
  today: string,
  days = 14,
): { date: string; on: boolean }[] {
  const start = addDays(today, -(days - 1));
  const on = new Set(
    list.filter((row) => row.task_key === habitKey && row.completed_on >= start && row.completed_on <= today).map((row) => row.completed_on),
  );
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(start, index);
    return { date, on: on.has(date) };
  });
}

export function missedYesterday(
  list: readonly Completion[],
  today: string,
  tasks: readonly TaskDef[],
  memberSince?: string,
): boolean {
  const daily = activeDaily(tasks);
  if (daily.length === 0) return false;
  const yesterday = addDays(today, -1);
  if (memberSince && memberSince.slice(0, 10) > yesterday) return false;
  const since = memberSince?.slice(0, 10);
  const hasHistory = list.some((row) => row.completed_on <= yesterday) || (!!since && since <= yesterday);
  if (!hasHistory) return false;
  const keys = new Set(daily.map((task) => task.key));
  const done = new Set(list.filter((row) => row.completed_on === yesterday && keys.has(row.task_key)).map((row) => row.task_key));
  return done.size < daily.length;
}

export function periodScore(
  list: readonly Completion[],
  from: string,
  to: string,
  tasks: readonly TaskDef[],
): { done: number; denom: number; pct: number } {
  const days = diffDays(to, from) + 1;
  if (days <= 0) return { done: 0, denom: 0, pct: 0 };
  const daily = activeDaily(tasks);
  const weekly = activeWeekly(tasks);
  const dailyKeys = new Set(daily.map((task) => task.key));
  const weeklyKeys = new Set(weekly.map((task) => task.key));
  const done = list.filter((row) => row.completed_on >= from && row.completed_on <= to && (dailyKeys.has(row.task_key) || weeklyKeys.has(row.task_key))).length;
  const denom = daily.length * days + weekly.reduce((sum, task) => sum + task.target, 0) * weeksTouched(from, to);
  const pct = denom <= 0 ? 0 : Math.min(100, Math.round((done / denom) * 100));
  return { done, denom, pct };
}

export type VehicleId = "gt" | "sport" | "sedan" | "moped" | "bike" | "walk";

export interface VehicleTier {
  id: VehicleId;
  min: number;
  name: string;
  genitive: string;
}

export const VEHICLE_TIERS: readonly VehicleTier[] = [
  { id: "gt", min: 90, name: "GT Turbo", genitive: "GT Turbo" },
  { id: "sport", min: 70, name: "Спорткар", genitive: "Спорткара" },
  { id: "sedan", min: 50, name: "Седан", genitive: "Седана" },
  { id: "moped", min: 30, name: "Мопед", genitive: "Мопеда" },
  { id: "bike", min: 10, name: "Велик", genitive: "Велика" },
  { id: "walk", min: 0, name: "Пешком", genitive: "Пешком" },
];

export function vehicleTier(pct: number): VehicleTier {
  const value = Math.max(0, Math.min(100, pct));
  return VEHICLE_TIERS.find((tier) => value >= tier.min) ?? {
    id: "walk",
    min: 0,
    name: "Пешком",
    genitive: "Пешком",
  };
}

export function marksWord(marks: number): string {
  const n10 = marks % 10;
  const n100 = marks % 100;
  if (n10 === 1 && n100 !== 11) return "отметка";
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return "отметки";
  return "отметок";
}

export function upgradeHint(done: number, denom: number): { marks: number; name: string; genitive: string } | null {
  if (denom <= 0) return null;
  const pct = (done / denom) * 100;
  if (pct >= 90) return null;
  const nextMin = [10, 30, 50, 70, 90].find((threshold) => pct < threshold);
  if (nextMin == null) return null;
  const marks = Math.max(1, Math.ceil((nextMin / 100) * denom - done - 1e-9));
  const tier = vehicleTier(nextMin);
  return { marks, name: tier.name, genitive: tier.genitive };
}

export function upgradePhrase(done: number, denom: number): string {
  if (denom <= 0) return "Добавьте привычку, чтобы выехать на трассу.";
  const hint = upgradeHint(done, denom);
  if (!hint) return "Вы на GT Turbo — финишный флаг ваш.";
  return `Ещё ${hint.marks} ${marksWord(hint.marks)} до ${hint.genitive}`;
}

export function defaultIdentity(task: { key: string; title: string }): string {
  if (task.key === "reading") return "Я — человек, который читает каждый день";
  if (task.key === "sport") return "Я — человек, который тренируется каждый день";
  const title = task.title.trim() || "это";
  return `Я — человек, для которого «${title}» — часть дня`;
}
