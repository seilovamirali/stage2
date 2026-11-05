import { describe, expect, it } from "vitest";
import { completionPct, type Completion, type TaskDef } from "./habits";
import {
  compoundSeries,
  dayChain,
  defaultIdentity,
  lawForDate,
  marksWord,
  missedYesterday,
  periodScore,
  upgradeHint,
  upgradePhrase,
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
  it("maps a percentage to a Russian vehicle", () => {
    expect(vehicleTier(0).name).toBe("Пешком");
    expect(vehicleTier(9).name).toBe("Пешком");
    expect(vehicleTier(10).name).toBe("Велик");
    expect(vehicleTier(29).name).toBe("Велик");
    expect(vehicleTier(30).name).toBe("Мопед");
    expect(vehicleTier(50).name).toBe("Седан");
    expect(vehicleTier(70).name).toBe("Спорткар");
    expect(vehicleTier(90).name).toBe("GT Turbo");
    expect(vehicleTier(100).name).toBe("GT Turbo");
  });

  it("counts marks to the next vehicle in the genitive", () => {
    expect(upgradeHint(8, 14)).toEqual({ marks: 2, name: "Спорткар", genitive: "Спорткара" });
    expect(upgradePhrase(8, 14)).toBe("Ещё 2 отметки до Спорткара");
    expect(upgradePhrase(14, 14)).toBe("Вы на GT Turbo — финишный флаг ваш.");
    expect(marksWord(1)).toBe("отметка");
    expect(marksWord(5)).toBe("отметок");
    expect(marksWord(21)).toBe("отметка");
  });
});

describe("identity statements", () => {
  it("keeps a member's own line for each habit", () => {
    expect(defaultIdentity({ key: "reading", title: "Книга" })).toBe("Я — человек, который читает каждый день");
    expect(saveIdentity("u", "reading", "Книга", "Я — человек, который читает утром")).toBe("Я — человек, который читает утром");
    expect(loadIdentity("u", "reading", "Книга")).toBe("Я — человек, который читает утром");
    expect(loadIdentity("other", "sport", "Спорт")).toBe("Я — человек, который тренируется каждый день");
  });
});
