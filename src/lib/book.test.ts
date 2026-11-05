import { describe, expect, it } from "vitest";
import { clampPage, clampTotalPages, bookPercent, pagePhrase, pagesReadToday, shouldRemindBookTask, groupBookStats, rankReaders, type BookProgress } from "./book";

const row = (page: number, total = 100, date = "2026-11-04", start = 0, user = "a"): BookProgress => ({
  user_id: user,
  book_title: user === "a" ? "Моя книга" : "Другая",
  total_pages: total,
  current_page: page,
  day_start_date: date,
  day_start_page: start,
  updated_at: "",
});

describe("personal book progress", () => {
  it("limits a page to the reader's own book", () => {
    expect(clampTotalPages(0)).toBe(1);
    expect(clampTotalPages(50000)).toBe(20000);
    expect(clampPage(-1, 100)).toBe(0);
    expect(clampPage(700, 120)).toBe(120);
    expect(clampPage(12.8, 300)).toBe(12);
  });
  it("uses that book's length for the percentage", () => {
    expect(bookPercent(50, 200)).toBe(25);
    expect(bookPercent(10, 10)).toBe(100);
  });
  it("says the current page in the club phrase", () => {
    expect(pagePhrase(12)).toBe("Я на странице 12");
  });
  it("counts only today's positive page difference", () => {
    expect(pagesReadToday(row(30, 100, "2026-11-04", 20), "2026-11-04")).toBe(10);
    expect(pagesReadToday(row(30, 100, "2026-11-03", 20), "2026-11-04")).toBe(0);
    expect(pagesReadToday(row(10, 100, "2026-11-04", 20), "2026-11-04")).toBe(0);
  });
  it("shows the habit reminder only at 10 or more pages", () => {
    expect(shouldRemindBookTask(9)).toBe(false);
    expect(shouldRemindBookTask(10)).toBe(true);
  });
  it("averages each saved reader's own percentage", () => {
    expect(groupBookStats([row(50, 100), row(0, 100, "2026-11-04", 0, "b")])).toEqual({ readers: 2, percent: 25 });
    expect(groupBookStats([])).toEqual({ readers: 0, percent: 0 });
  });
  it("ranks all profiles, with unsaved profiles at zero", () => {
    expect(rankReaders(
      [{ id: "a", display_name: "А" }, { id: "b", display_name: "Б" }],
      [row(10, 10, "2026-11-04", 0, "b"), row(50, 200)],
    ).map((p) => [p.id, p.page, p.percent])).toEqual([["b", 10, 100], ["a", 50, 25]]);
  });
});
