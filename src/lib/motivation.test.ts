import { describe, expect, it } from "vitest";
import { DAILY_MOTIVATION, dailySpeech, habitsLeftLine, motivationForDate } from "./motivation";

describe("daily motivation", () => {
  it("has one line for each day of a long month", () => {
    expect(DAILY_MOTIVATION).toHaveLength(31);
    expect(new Set(DAILY_MOTIVATION).size).toBe(31);
  });
  it("follows the Almaty calendar day", () => {
    expect(motivationForDate("2026-11-01")).toBe(DAILY_MOTIVATION[0]);
    expect(motivationForDate("2026-11-13")).toBe(DAILY_MOTIVATION[12]);
    expect(motivationForDate("2026-11-31")).toBe(DAILY_MOTIVATION[30]);
  });
  it("adds how many habits are still open", () => {
    expect(habitsLeftLine(1)).toBe("Осталась 1 привычка — закрой её до полуночи.");
    expect(habitsLeftLine(3)).toBe("Осталось 3 привычки — закрой их до полуночи.");
    expect(habitsLeftLine(6)).toBe("Осталось 6 привычек — закрой их до полуночи.");
    const open = dailySpeech("2026-11-14", 4).split(/(?<=[.!?])\s+/);
    expect(open.length).toBe(3);
    expect(open[2]).toBe("Осталось 4 привычки — закрой их до полуночи.");
    const done = dailySpeech("2026-11-14", 0).split(/(?<=[.!?])\s+/);
    expect(done).toHaveLength(2);
    expect(done[1]).toBe("Все привычки на сегодня закрыты.");
  });
});
