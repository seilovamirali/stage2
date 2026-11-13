import { describe, expect, it } from "vitest";
import { habitsLeft, reminderBody } from "../../supabase/functions/send-habit-reminders/remind";

describe("habit reminder selection", () => {
  it("counts only the six shared habits", () => {
    expect(habitsLeft([])).toBe(6);
    expect(habitsLeft(["book", "book", "sport", "other"])).toBe(4);
    expect(habitsLeft(["book", "sport", "language", "vitamin_c", "vitamin_e", "kk"])).toBe(0);
  });
  it("names the remaining count in Russian", () => {
    expect(reminderBody(1, "04:00")).toBe("Сегодня осталась 1 привычка — до полуночи 04:00");
    expect(reminderBody(2, "01:30")).toBe("Сегодня осталось 2 привычки — до полуночи 01:30");
    expect(reminderBody(6, "04:00")).toBe("Сегодня осталось 6 привычек — до полуночи 04:00");
  });
});
