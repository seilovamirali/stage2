import { describe, expect, it } from "vitest";
import { countdownTone, formatCountdown, secondsUntilAlmatyMidnight } from "./countdown";

describe("Almaty midnight countdown", () => {
  it("leaves four hours at 20:00 Almaty", () => {
    expect(secondsUntilAlmatyMidnight(new Date("2026-11-13T15:00:00Z"))).toBe(4 * 3600);
    expect(formatCountdown(4 * 3600)).toBe("04:00:00");
  });
  it("leaves one second at 23:59:59", () => {
    expect(secondsUntilAlmatyMidnight(new Date("2026-11-13T18:59:59Z"))).toBe(1);
    expect(formatCountdown(1)).toBe("00:00:01");
  });
  it("colors the clock by the time left until midnight", () => {
    expect(countdownTone(6 * 3600 + 1)).toBe("green");
    expect(countdownTone(24 * 3600)).toBe("green");
    expect(countdownTone(6 * 3600)).toBe("orange");
    expect(countdownTone(2 * 3600)).toBe("orange");
    expect(countdownTone(2 * 3600 - 1)).toBe("red");
    expect(countdownTone(0)).toBe("red");
  });
  it("shows a full day exactly at midnight", () => {
    expect(secondsUntilAlmatyMidnight(new Date("2026-11-13T19:00:00Z"))).toBe(24 * 3600);
    expect(formatCountdown(24 * 3600)).toBe("24:00:00");
  });
});
