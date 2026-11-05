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
  it("ships the two club habits", () => {
    expect(ALL_TASKS.map((task) => [task.key, task.title])).toEqual([
      ["reading", "Книга"],
      ["sport", "Спорт"],
    ]);
  });
  it("today uses Almaty timezone (UTC+5)", () => {
    expect(almatyToday(new Date("2026-11-01T20:30:00Z"))).toBe("2026-11-02");
  });
  it("weeks start on Monday", () => {
    expect(weekStart("2026-11-08")).toBe("2026-11-02"); // Sunday -> Monday
    expect(weekStart("2026-11-02")).toBe("2026-11-02");
  });
  it("each habit is 10 points and a perfect day adds 20", () => {
    expect(computePoints([{ user_id: "u", task_key: "reading", completed_on: "2026-11-02" }])).toBe(10);
    expect(computePoints([{ user_id: "u", task_key: "sport", completed_on: "2026-11-02" }])).toBe(10);
    expect(computePoints(day("2026-11-02"))).toBe(40);
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
    expect(completionPct(list, "2026-11-02", "2026-11-02", withWeekly)).toBe(40);
    expect(computePoints([{ user_id: "u", task_key: "extra", completed_on: "2026-11-02" }], "2026-11-02", "2026-11-02", withWeekly)).toBe(20);
  });
  it("scores only active habits, so archiving one daily task changes the day", () => {
    const tasks = ALL_TASKS.map((task) => task.key === "sport" ? { ...task, archived: true } : task);
    const list = day("2026-11-02").filter((row) => row.task_key !== "sport");
    expect(computePoints(list, "0000-01-01", "9999-12-31", tasks)).toBe(30);
    expect(completionPct(list, "2026-11-02", "2026-11-02", tasks)).toBe(100);
  });
});
