import { describe, expect, it } from "vitest";
import type { ExpenseCategory } from "../services/expenseService";
import { budgetUsage, expenseCategoryOption, spendingByCategory, totalSpent } from "./expenseUtils";

const expense = (amount: number, category: ExpenseCategory) => ({ amount, category });

describe("totalSpent", () => {
  it("adds up the amounts", () => {
    expect(totalSpent([expense(380, "FLIGHT"), expense(65.5, "FOOD")])).toBe(445.5);
    expect(totalSpent([])).toBe(0);
  });
});

describe("spendingByCategory", () => {
  it("totals each category, biggest first, with percentages of the whole", () => {
    expect(spendingByCategory([expense(25, "FOOD"), expense(600, "HOTEL"), expense(75, "FOOD"), expense(300, "FLIGHT")])).toEqual([
      { category: "HOTEL", total: 600, percent: 60 },
      { category: "FLIGHT", total: 300, percent: 30 },
      { category: "FOOD", total: 100, percent: 10 },
    ]);
  });

  it("is empty when nothing has been spent", () => {
    expect(spendingByCategory([])).toEqual([]);
  });
});

describe("budgetUsage", () => {
  it("reports how much of the budget is used and what's left", () => {
    expect(budgetUsage(1860, 3000)).toEqual({ spent: 1860, budget: 3000, percent: 62, remaining: 1140, over: false });
  });

  it("caps the bar at 100% but flags an exceeded budget", () => {
    expect(budgetUsage(3300, 3000)).toMatchObject({ percent: 100, remaining: -300, over: true });
  });

  it("has no percentage when the trip has no budget", () => {
    expect(budgetUsage(500, null)).toMatchObject({ budget: null, percent: null, remaining: null, over: false });
  });
});

describe("expenseCategoryOption", () => {
  it("gives each category its label and emoji", () => {
    expect(expenseCategoryOption("HOTEL")).toMatchObject({ label: "Stay", emoji: "🏨" });
  });
});
