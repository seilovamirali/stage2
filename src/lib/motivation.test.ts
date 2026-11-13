import { describe, expect, it } from "vitest";
import { DAILY_MOTIVATION, motivationForDate } from "./motivation";

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
});
