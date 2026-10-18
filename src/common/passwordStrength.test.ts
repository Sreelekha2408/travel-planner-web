import { describe, expect, it } from "vitest";
import { getPasswordStrength, meetsPasswordRule } from "./passwordStrength";

describe("getPasswordStrength", () => {
  it.each([
    ["", 0],
    ["abc", 0], // too short, letters only
    ["abcdefgh", 1], // 8+ characters
    ["travel2026", 2], // + letters and numbers
    ["Travel2026", 3], // + upper and lower case
    ["Travel2026!", 4], // + a symbol
  ])("scores %j as %i", (password, score) => {
    expect(getPasswordStrength(password).score).toBe(score);
  });
});

describe("meetsPasswordRule (same rule as the backend)", () => {
  it("needs 8+ characters with both letters and numbers", () => {
    expect(meetsPasswordRule("travel2026")).toBe(true);
    expect(meetsPasswordRule("travel")).toBe(false); // too short
    expect(meetsPasswordRule("travelling")).toBe(false); // no number
    expect(meetsPasswordRule("12345678")).toBe(false); // no letter
  });
});
