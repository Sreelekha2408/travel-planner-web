import { apiFetch } from "./serviceWrapper";

// Mirrors the ExpenseType enum in travel-planner-api.
export type ExpenseCategory = "FLIGHT" | "TRANSPORT" | "HOTEL" | "FOOD" | "ACTIVITIES" | "SHOPPING" | "OTHER";

// Mirrors ExpenseResponse. expenseDate is yyyy-MM-dd.
export type Expense = {
  expenseId: number;
  title: string;
  amount: number;
  category: ExpenseCategory;
  currency: string; // the trip's currency unless sent otherwise
  paymentMethod: string | null;
  expenseDate: string;
  tripId: number;
};

// Mirrors ExpenseRequest. currency is left out: the backend uses the trip's.
export type ExpenseInput = {
  title: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: string | null;
  expenseDate: string;
};

// Newest first (the backend sorts by date).
export function getExpenses(tripId: number) {
  return apiFetch<Expense[]>(`/expenses/${tripId}`);
}

export function addExpense(tripId: number, input: ExpenseInput) {
  return apiFetch<Expense>(`/expenses/${tripId}`, { method: "POST", body: JSON.stringify(input) });
}

export function updateExpense(expenseId: number, input: ExpenseInput) {
  return apiFetch<Expense>(`/expenses/${expenseId}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteExpense(expenseId: number) {
  return apiFetch<string>(`/expenses/${expenseId}`, { method: "DELETE" });
}
