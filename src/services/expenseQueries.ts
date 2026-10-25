import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as expenseService from "./expenseService";
import type { ExpenseInput } from "./expenseService";

// One cache entry per trip's expenses. Sign-out clears the whole query cache.
export const expenseKeys = {
  all: ["expenses"] as const,
  trip: (tripId: number) => ["expenses", tripId] as const,
};

export function useExpenses(tripId: number) {
  return useQuery({
    queryKey: expenseKeys.trip(tripId),
    queryFn: () => expenseService.getExpenses(tripId),
    enabled: Number.isInteger(tripId),
  });
}

// Mutations refetch that trip's expenses, so the list, totals and budget tracker all
// show what the server saved.
export function useAddExpense(tripId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpenseInput) => expenseService.addExpense(tripId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.trip(tripId) }),
  });
}

export function useUpdateExpense(tripId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ expenseId, input }: { expenseId: number; input: ExpenseInput }) => expenseService.updateExpense(expenseId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.trip(tripId) }),
  });
}

export function useDeleteExpense(tripId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: number) => expenseService.deleteExpense(expenseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.trip(tripId) }),
  });
}
