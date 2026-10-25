import { describe, expect, it } from "vitest";
import type { ExpenseCategory } from "../services/expenseService";
import { budgetUsage, expenseCategoryOption, spendingByCategory, spentByCurrency, totalSpent } from "./expenseUtils";

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

describe("spentByCurrency", () => {
  const trips = [
    { tripId: 1, currency: "EUR", budget: 2000 },
    { tripId: 2, currency: "USD", budget: 3000 },
    { tripId: 3, currency: "EUR", budget: null },
    { tripId: 4, currency: "JPY", budget: 50000 },
  ];
  const expenses = new Map([
    [1, [{ amount: 900 }, { amount: 100 }]],
    [2, [{ amount: 600 }]],
    [3, [{ amount: 500 }]],
  ]);

  it("totals each currency separately, never mixing them, biggest first", () => {
    expect(spentByCurrency(trips, expenses)).toEqual([
      { currency: "EUR", spent: 1500, budget: 2000, percent: 75 },
      { currency: "USD", spent: 600, budget: 3000, percent: 20 },
    ]);
  });

  it("leaves out the budgets of trips with nothing spent yet", () => {
    const withUpcoming = [...trips, { tripId: 5, currency: "EUR", budget: 4000 }]; // no expenses
    expect(spentByCurrency(withUpcoming, expenses)[0]).toEqual({ currency: "EUR", spent: 1500, budget: 2000, percent: 75 });
  });

  it("has no percentage when none of that currency's trips has a budget", () => {
    expect(spentByCurrency([{ tripId: 3, currency: "EUR", budget: null }], expenses)).toEqual([{ currency: "EUR", spent: 500, budget: 0, percent: null }]);
  });
});
