import { expenseColors } from "./theme";
import type { Expense, ExpenseCategory } from "../services/expenseService";

// Label, emoji and colours for each category, in the order the category picker shows.
export const expenseCategoryOptions: { value: ExpenseCategory; label: string; emoji: string; tile: string; chart: string }[] = [
  { value: "FOOD", label: "Food", emoji: "🍽️", ...expenseColors.FOOD },
  { value: "HOTEL", label: "Stay", emoji: "🏨", ...expenseColors.HOTEL },
  { value: "TRANSPORT", label: "Transport", emoji: "🚗", ...expenseColors.TRANSPORT },
  { value: "FLIGHT", label: "Flights", emoji: "✈️", ...expenseColors.FLIGHT },
  { value: "ACTIVITIES", label: "Activities", emoji: "🎡", ...expenseColors.ACTIVITIES },
  { value: "SHOPPING", label: "Shopping", emoji: "🛍️", ...expenseColors.SHOPPING },
  { value: "OTHER", label: "Other", emoji: "🧾", ...expenseColors.OTHER },
];

export function expenseCategoryOption(category: ExpenseCategory) {
  return expenseCategoryOptions.find((option) => option.value === category) ?? expenseCategoryOptions[expenseCategoryOptions.length - 1];
}

// All of a trip's expenses are in the trip's currency (the backend defaults to it), so
// they can simply be added up.
export function totalSpent(expenses: Pick<Expense, "amount">[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

export type CategoryTotal = { category: ExpenseCategory; total: number; percent: number };

// Spend per category, biggest first, with whole-number percentages of the total
// (like the design's "Transport 41%"). Categories with nothing spent are left out.
export function spendingByCategory(expenses: Pick<Expense, "amount" | "category">[]): CategoryTotal[] {
  const total = totalSpent(expenses);
  const sums = new Map<ExpenseCategory, number>();
  for (const expense of expenses) sums.set(expense.category, (sums.get(expense.category) ?? 0) + expense.amount);
  return [...sums.entries()]
    .map(([category, sum]) => ({ category, total: sum, percent: total > 0 ? Math.round((sum / total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total);
}

export type BudgetUsage = { spent: number; budget: number | null; percent: number | null; remaining: number | null; over: boolean };

// For the budget tracker: how much of the budget is used. percent is capped at 100 for
// the bar; over says the budget has been exceeded. No budget set -> nulls.
export function budgetUsage(spent: number, budget: number | null): BudgetUsage {
  if (budget == null || budget <= 0) return { spent, budget: null, percent: null, remaining: null, over: false };
  return { spent, budget, percent: Math.min(100, Math.round((spent / budget) * 100)), remaining: budget - spent, over: spent > budget };
}
