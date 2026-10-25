import { Alert, Box, Button, Skeleton, Typography } from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import dayjs from "dayjs";
import { useState } from "react";
import { spendingByCategory, totalSpent } from "../../common/expenseUtils";
import { formatBudget } from "../../common/tripUtils";
import { useNotify } from "../../context/useNotify";
import { useAddExpense, useDeleteExpense, useExpenses, useUpdateExpense } from "../../services/expenseQueries";
import type { Expense, ExpenseInput } from "../../services/expenseService";
import type { Trip } from "../../services/tripService";
import CategoryCards from "./CategoryCards";
import ExpenseForm from "./ExpenseForm";
import ExpenseRow from "./ExpenseRow";
import SpendingDonut from "./SpendingDonut";

// Which inline form is open: adding, or editing one expense. One at a time.
type OpenForm = { mode: "add" } | { mode: "edit"; expenseId: number } | null;

// A new expense defaults to today while the trip is on, otherwise its first day.
function defaultExpenseDate(trip: Pick<Trip, "startDate" | "endDate">): string {
  const today = dayjs().format("YYYY-MM-DD");
  return today >= trip.startDate && today <= trip.endDate ? today : trip.startDate;
}

// The trip page's Expenses tab, after the design's Expenses screen: what's been spent,
// the biggest categories, the transactions (with inline add/edit/delete) and a breakdown.
const TripExpenses = ({ trip }: { trip: Trip }) => {
  const { data: expenses, isPending, isError, error, refetch } = useExpenses(trip.tripId);
  const addExpense = useAddExpense(trip.tripId);
  const updateExpense = useUpdateExpense(trip.tripId);
  const deleteExpense = useDeleteExpense(trip.tripId);
  const notify = useNotify();
  const [openForm, setOpenForm] = useState<OpenForm>(null);

  // Opening a form clears the previous form's error state.
  const open = (form: OpenForm) => {
    addExpense.reset();
    updateExpense.reset();
    deleteExpense.reset();
    setOpenForm(form);
  };
  const close = () => open(null);

  const add = (input: ExpenseInput) =>
    addExpense.mutate(input, {
      onSuccess: () => {
        notify.success(`“${input.title}” added`);
        close();
      },
    });
  const save = (expense: Expense, input: ExpenseInput) =>
    updateExpense.mutate(
      { expenseId: expense.expenseId, input },
      {
        onSuccess: () => {
          notify.success(`“${input.title}” saved`);
          close();
        },
      },
    );
  // Like the itinerary, deleting is only reachable from inside the edit form.
  const remove = (expense: Expense) =>
    deleteExpense.mutate(expense.expenseId, {
      onSuccess: () => {
        notify.success(`“${expense.title}” removed`);
        close();
      },
    });

  if (isPending) {
    return (
      <Box aria-busy="true" aria-label="Loading expenses" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Skeleton variant="text" width={220} />
        <Skeleton variant="rounded" height={90} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={60} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }
  if (isError) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}>
        Couldn't load the expenses. {error.message}
      </Alert>
    );
  }

  const spent = totalSpent(expenses);
  const categories = spendingByCategory(expenses);
  const summary = trip.budget != null ? `${formatBudget(spent, trip.currency)} of ${formatBudget(trip.budget, trip.currency)} used` : `${formatBudget(spent, trip.currency)} spent`;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
        <Typography sx={{ fontSize: 14, color: "text.secondary" }}>{summary}</Typography>
        {openForm?.mode !== "add" && (
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => open({ mode: "add" })}>
            Add expense
          </Button>
        )}
      </Box>

      {openForm?.mode === "add" && (
        <ExpenseForm
          defaultDate={defaultExpenseDate(trip)}
          currency={trip.currency}
          saving={addExpense.isPending}
          error={addExpense.error?.message ?? null}
          onSave={add}
          onCancel={close}
        />
      )}

      {expenses.length === 0 ? (
        openForm?.mode !== "add" && (
          <Box sx={{ bgcolor: "background.paper", borderRadius: 4, boxShadow: 1, p: 3 }}>
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>No expenses yet</Typography>
            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
              Add what you spend as you go, and see where the money goes against your budget.
            </Typography>
          </Box>
        )
      ) : (
        <>
          <CategoryCards categories={categories} currency={trip.currency} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 240px" }, gap: 2.5, alignItems: "start" }}>
            <Box component="section" aria-labelledby="expenses-recent">
              <Typography id="expenses-recent" component="h2" sx={{ fontSize: 15, fontWeight: 700, mb: 1.5 }}>Recent transactions</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {expenses.map((expense) =>
                  openForm?.mode === "edit" && openForm.expenseId === expense.expenseId ? (
                    <ExpenseForm
                      key={expense.expenseId}
                      expense={expense}
                      defaultDate={expense.expenseDate}
                      currency={expense.currency}
                      saving={updateExpense.isPending}
                      deleting={deleteExpense.isPending}
                      error={(updateExpense.error ?? deleteExpense.error)?.message ?? null}
                      onSave={(input) => save(expense, input)}
                      onCancel={close}
                      onDelete={() => remove(expense)}
                    />
                  ) : (
                    <ExpenseRow key={expense.expenseId} expense={expense} onEdit={() => open({ mode: "edit", expenseId: expense.expenseId })} />
                  ),
                )}
              </Box>
            </Box>
            <Box component="section" aria-labelledby="expenses-breakdown">
              <Typography id="expenses-breakdown" component="h2" sx={{ fontSize: 15, fontWeight: 700, mb: 1.5 }}>Spending breakdown</Typography>
              <SpendingDonut categories={categories} total={spent} currency={trip.currency} />
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};
export default TripExpenses;
