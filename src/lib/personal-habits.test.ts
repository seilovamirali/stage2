import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DAILY_TASKS } from "./habits";
import { applyHabitChange, seedAccount } from "./personal-habits";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith(".ts") || path.endsWith(".tsx") ? [path] : [];
  });
}

describe("two accounts keep separate habit copies", () => {
  it("leaves the other account and the default template untouched", () => {
    const before = {
      ali: seedAccount("ali"),
      bek: seedAccount("bek"),
    };
    const template = DAILY_TASKS.map((task) => ({ ...task }));
    const after = applyHabitChange(before, "ali", {
      type: "edit",
      key: "reading",
      title: "Ночная книга",
      description: "20 страниц",
      emoji: "📖",
      kind: "weekly",
      target: 3,
      points: 15,
    });
    const withExtra = applyHabitChange(after, "ali", {
      type: "add",
      habit: { key: "water", title: "Вода", description: "2 литра", emoji: "💧", kind: "daily", target: 1, points: 5 },
    });
    const archived = applyHabitChange(withExtra, "ali", { type: "archive", key: "sport" });

    const bek = archived.bek ?? [];
    const ali = archived.ali ?? [];
    expect(bek.map((habit) => [habit.key, habit.title, habit.archived])).toEqual([
      ["reading", "Книга", false],
      ["sport", "Спорт", false],
    ]);
    expect(ali.find((habit) => habit.key === "reading")).toMatchObject({ title: "Ночная книга", kind: "weekly", target: 3 });
    expect(ali.find((habit) => habit.key === "sport")?.archived).toBe(true);
    expect(ali.some((habit) => habit.key === "water")).toBe(true);
    expect(DAILY_TASKS.map((task) => ({ ...task }))).toEqual(template);
    expect(before.bek).toEqual(seedAccount("bek"));
  });

  it("never writes the shared habit template from the app", () => {
    const offenders = sourceFiles(join(process.cwd(), "src"))
      .filter((path) => !path.endsWith("personal-habits.test.ts"))
      .filter((path) => /from\(["']club_habits["']\)\s*\.\s*(update|insert|delete|upsert)/.test(readFileSync(path, "utf8")));
    expect(offenders).toEqual([]);
  });
});
