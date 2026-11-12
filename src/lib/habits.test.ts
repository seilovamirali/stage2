import { describe, it, expect } from "vitest";
import {
  almatyToday, weekStart, computePoints, currentStreak, bestStreak, levelInfo,
  completionPct, ALL_TASKS, DAILY_TASKS, type Completion, type TaskDef,
} from "./habits";

const day = (d: string, u = "u"): Completion[] => DAILY_TASKS.map((t) => ({ user_id: u, task_key: t.key, completed_on: d }));

const withWeekly: TaskDef[] = [
  ...DAILY_TASKS,
  { key: "extra", title: "Дополнительно", description: "3 раза в неделю", emoji: "⭐", kind: "weekly", target: 3, points: 20, sortOrder: 30 },
];

describe("habits rules", () => {
  it("ships the six shared habits", () => {
    expect(ALL_TASKS.map((task) => [task.key, task.title, task.points])).toEqual([
      ["book", "Книга", 1],
      ["sport", "Спорт", 1],
      ["language", "Иностранный язык", 1],
      ["vitamin_c", "Витамин C", 1],
      ["vitamin_e", "Витамин E", 1],
      ["kk", "КК", 1],
    ]);
  });
  it("today uses Almaty timezone (UTC+5)", () => {
    expect(almatyToday(new Date("2026-11-01T20:30:00Z"))).toBe("2026-11-02");
  });
  it("weeks start on Monday", () => {
    expect(weekStart("2026-11-08")).toBe("2026-11-02"); // Sunday -> Monday
    expect(weekStart("2026-11-02")).toBe("2026-11-02");
  });
  it("each finished habit is one point and nothing is added on top", () => {
    expect(computePoints([{ user_id: "u", task_key: "book", completed_on: "2026-11-02" }])).toBe(1);
    expect(computePoints([{ user_id: "u", task_key: "sport", completed_on: "2026-11-02" }])).toBe(1);
    expect(computePoints(day("2026-11-02"))).toBe(DAILY_TASKS.length);
  });
  it("streak counts from yesterday if today unfinished", () => {
    const list = [...day("2026-10-31"), ...day("2026-11-01")];
    expect(currentStreak(list, "2026-11-02")).toBe(2);
    expect(currentStreak(list, "2026-11-03")).toBe(0);
    expect(bestStreak([...list, ...day("2026-11-05")])).toBe(2);
  });
  it("level = floor(sqrt(points/50)) + 1", () => {
    expect(levelInfo(0).level).toBe(1);
    expect(levelInfo(49).level).toBe(1);
    expect(levelInfo(50).level).toBe(2);
    expect(levelInfo(200).level).toBe(3);
  });
  it("period percent counts dailies per day and weekly targets per touched week", () => {
    const list = day("2026-11-02");
    expect(completionPct(list, "2026-11-02", "2026-11-02")).toBe(100);
    const two: TaskDef[] = [
      { key: "book", title: "Книга", description: "", emoji: "📚", kind: "daily", target: 1, points: 1 },
      { key: "sport", title: "Спорт", description: "", emoji: "💪", kind: "daily", target: 1, points: 1 },
      withWeekly[withWeekly.length - 1]!,
    ];
    const pair = [
      { user_id: "u", task_key: "book", completed_on: "2026-11-02" },
      { user_id: "u", task_key: "sport", completed_on: "2026-11-02" },
    ];
    expect(completionPct(pair, "2026-11-02", "2026-11-02", two)).toBe(40);
    expect(computePoints([{ user_id: "u", task_key: "extra", completed_on: "2026-11-02" }], "2026-11-02", "2026-11-02", withWeekly)).toBe(1);
  });
  it("scores only active habits, so archiving one daily task changes the day", () => {
    const tasks = ALL_TASKS.map((task) => task.key === "kk" ? { ...task, archived: true } : task);
    const list = day("2026-11-02").filter((row) => row.task_key !== "kk");
    expect(computePoints(list, "0000-01-01", "9999-12-31", tasks)).toBe(5);
    expect(completionPct(list, "2026-11-02", "2026-11-02", tasks)).toBe(100);
  });
});
