import { describe, expect, it } from "vitest";
import { vehicleCheer } from "./vehicle-cheer";

describe("vehicle cheer", () => {
  it("names the current ride and the next one", () => {
    expect(vehicleCheer("2026-11-01", 0)).toContain("пешком");
    expect(vehicleCheer("2026-11-01", 0)).toContain("самокат");
    expect(vehicleCheer("2026-11-01", 14)).toContain("на самокате");
    expect(vehicleCheer("2026-11-01", 14)).toContain("на велик");
    expect(vehicleCheer("2026-11-01", 23)).toContain("на велике");
    expect(vehicleCheer("2026-11-01", 32)).toContain("на лошади");
    expect(vehicleCheer("2026-11-01", 41)).toContain("на мотоцикле");
    expect(vehicleCheer("2026-11-01", 50)).toContain("на седане");
    expect(vehicleCheer("2026-11-01", 59)).toContain("на кроссовере");
    expect(vehicleCheer("2026-11-01", 68)).toContain("на джипе");
    expect(vehicleCheer("2026-11-01", 77)).toContain("на спорткаре");
    expect(vehicleCheer("2026-11-01", 86)).toContain("на самолёте");
    expect(vehicleCheer("2026-11-01", 86)).toContain("на ракету");
  });

  it("rotates the line with the Almaty day", () => {
    expect(vehicleCheer("2026-11-01", 14)).not.toBe(vehicleCheer("2026-11-02", 14));
    expect(vehicleCheer("2026-11-01", 14)).toBe(vehicleCheer("2026-11-04", 14));
  });

  it("tells the rocket to hold the lead", () => {
    const line = vehicleCheer("2026-11-01", 96);
    expect(line).toContain("ракет");
    expect(line.toLowerCase()).toContain("держи");
    expect(line).not.toContain("пересядешь");
  });
});