import { describe, expect, it } from "vitest";
import { completionPct, type Completion, type TaskDef } from "./habits";
import {
  compoundSeries,
  dayChain,
  defaultIdentity,
  lawForDate,
  marksWord,
  missedYesterday,
  monthRace,
  monthWindow,
  periodScore,
  upgradeHint,
  upgradePhrase,
  VEHICLE_TIERS,
  vehicleTier,
} from "./atomic";
import { loadIdentity, saveIdentity } from "./identity";

const tasks: TaskDef[] = [
  { key: "reading", title: "Книга", description: "", emoji: "📚", kind: "daily", target: 1, points: 10 },
  { key: "sport", title: "Спорт", description: "", emoji: "💪", kind: "daily", target: 1, points: 10 },
];

const row = (task: string, date: string): Completion => ({ user_id: "u", task_key: task, completed_on: date });

describe("atomic habits helpers", () => {
  it("rotates one law per day and keeps the same law for that day", () => {
    expect(lawForDate("2026-11-05")).toBe(lawForDate("2026-11-05"));
    expect(lawForDate("2026-11-05").title.length).toBeGreaterThan(0);
  });

  it("compounds 1% on the days a habit was actually done", () => {
    const flat = compoundSeries([], "2026-11-05", tasks, 3);
    expect(flat[2]?.actual).toBe(1);
    expect(flat[2]?.ideal).toBeCloseTo(1.01 ** 3);
    const perfect = compoundSeries([row("reading", "2026-11-05"), row("sport", "2026-11-05")], "2026-11-05", tasks, 1);
    expect(perfect[0]?.actual).toBeCloseTo(1.01);
  });

  it("fills the chain only when the day's habits are done", () => {
    const dots = dayChain([row("reading", "2026-11-05")], "2026-11-05", tasks, 2);
    expect(dots.map((dot) => dot.state)).toEqual(["empty", "partial"]);
    const full = dayChain([row("reading", "2026-11-05"), row("sport", "2026-11-05")], "2026-11-05", tasks, 1);
    expect(full[0]?.state).toBe("full");
  });

  it("warns about yesterday only after the member has had a day to miss", () => {
    const list = [row("reading", "2026-11-03"), row("sport", "2026-11-03")];
    expect(missedYesterday(list, "2026-11-05", tasks, "2026-11-01")).toBe(true);
    expect(missedYesterday([...list, row("reading", "2026-11-04"), row("sport", "2026-11-04")], "2026-11-05", tasks)).toBe(false);
    expect(missedYesterday([], "2026-11-05", tasks, "2026-11-05")).toBe(false);
  });

  it("matches the leaderboard percentage", () => {
    const list = [row("reading", "2026-11-02"), row("sport", "2026-11-02")];
    const score = periodScore(list, "2026-11-02", "2026-11-02", tasks);
    expect(score.pct).toBe(completionPct(list, "2026-11-02", "2026-11-02", tasks));
    expect(score).toMatchObject({ done: 2, denom: 2, pct: 100 });
  });
});

describe("race tiers", () => {
  it("splits the pace into eleven even bands", () => {
    expect(VEHICLE_TIERS).toHaveLength(11);
    const seen = new Set<string>();
    for (let pct = 0; pct <= 100; pct += 1) seen.add(vehicleTier(pct).id);
    expect(seen.size).toBe(11);
    expect(vehicleTier(0).name).toBe("Пешком");
    expect(vehicleTier(9).name).toBe("Пешком");
    expect(vehicleTier(10).name).toBe("Самокат");
    expect(vehicleTier(18).name).toBe("Самокат");
    expect(vehicleTier(19).name).toBe("Велик");
    expect(vehicleTier(27).name).toBe("Велик");
    expect(vehicleTier(28).name).toBe("Лошадь");
    expect(vehicleTier(36).name).toBe("Лошадь");
    expect(vehicleTier(37).name).toBe("Мотоцикл");
    expect(vehicleTier(45).name).toBe("Мотоцикл");
    expect(vehicleTier(46).name).toBe("Седан");
    expect(vehicleTier(54).name).toBe("Седан");
    expect(vehicleTier(55).name).toBe("Кроссовер");
    expect(vehicleTier(63).name).toBe("Кроссовер");
    expect(vehicleTier(64).name).toBe("Джип");
    expect(vehicleTier(72).name).toBe("Джип");
    expect(vehicleTier(73).name).toBe("Спорткар");
    expect(vehicleTier(81).name).toBe("Спорткар");
    expect(vehicleTier(82).name).toBe("Самолёт");
    expect(vehicleTier(90).name).toBe("Самолёт");
    expect(vehicleTier(91).name).toBe("Ракета");
    expect(vehicleTier(100).name).toBe("Ракета");
    expect(vehicleTier(-4).name).toBe("Пешком");
    expect(vehicleTier(140).name).toBe("Ракета");
  });

  it("counts marks to the next vehicle in the genitive", () => {
    expect(upgradeHint(8, 14)).toEqual({ marks: 1, name: "Джип", genitive: "Джипа" });
    expect(upgradePhrase(8, 14)).toBe("Ещё 1 отметка до Джипа");
    expect(upgradePhrase(0, 10)).toBe("Ещё 1 отметка до Самоката");
    expect(upgradePhrase(14, 14)).toBe("Вы на Ракете — финишный флаг ваш.");
    expect(marksWord(1)).toBe("отметка");
    expect(marksWord(5)).toBe("отметок");
    expect(marksWord(21)).toBe("отметка");
  });
});

describe("monthly race scored by points", () => {
  const daily: TaskDef[] = [
    { key: "book", title: "Книга", description: "", emoji: "📚", kind: "daily", target: 1, points: 1 },
    { key: "sport", title: "Спорт", description: "", emoji: "💪", kind: "daily", target: 1, points: 1 },
  ];
  const mark = (key: string, date: string): Completion => ({ user_id: "a", task_key: key, completed_on: date });
  const both = (date: string) => [mark("book", date), mark("sport", date)];

  it("uses November 2026 as a 30-day track", () => {
    expect(monthWindow("2026-11-12")).toEqual({ start: "2026-11-01", end: "2026-11-30", days: 30 });
  });

  it("puts a perfect month on the finish and a partial month in proportion to points", () => {
    const list = Array.from({ length: 30 }, (_, index) => both(`2026-11-${String(index + 1).padStart(2, "0")}`)).flat();
    const race = monthRace(list, daily, "2026-11-01", "2026-11-30", "2026-12-01");
    expect(race.positionDays).toBe(60);
    expect(race.positionPct).toBe(100);
    expect(race.debt).toBe(0);
    const mid = monthRace(list, daily, "2026-11-01", "2026-11-30", "2026-11-12");
    expect(mid.positionDays).toBe(24);
    expect(mid.positionPct).toBe(40);
    expect(mid.daysLeft).toBe(18);
  });

  it("does not roll the car back when a day is missed", () => {
    const list = both("2026-11-01");
    const race = monthRace(list, daily, "2026-11-01", "2026-11-30", "2026-11-03");
    expect(race.positionDays).toBe(2);
    expect(race.debt).toBe(0);
    expect(race.days[1]?.status).toBe("miss");
  });
});

describe("identity statements", () => {
  it("keeps a member's own line for each habit", () => {
    expect(defaultIdentity({ key: "book", title: "Книга" })).toBe("Я — человек, который читает каждый день");
    expect(saveIdentity("u", "book", "Книга", "Я — человек, который читает утром")).toBe("Я — человек, который читает утром");
    expect(loadIdentity("u", "book", "Книга")).toBe("Я — человек, который читает утром");
    expect(loadIdentity("other", "sport", "Спорт")).toBe("Я — человек, который тренируется каждый день");
  });
});
