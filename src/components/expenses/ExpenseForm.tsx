import { Alert, Box, Button, InputAdornment, MenuItem, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import { Controller, useForm } from "react-hook-form";
import { expenseCategoryOptions } from "../../common/expenseUtils";
import { currencySymbol, DEFAULT_CURRENCY } from "../../common/tripUtils";
import type { Expense, ExpenseCategory, ExpenseInput } from "../../services/expenseService";

type ExpenseFormValues = {
  title: string;
  amount: string;
  category: ExpenseCategory;
  expenseDate: Dayjs | null;
  paymentMethod: string;
};

function toFormValues(expense: Expense | undefined, defaultDate: string): ExpenseFormValues {
  return {
    title: expense?.title ?? "",
    amount: expense ? String(expense.amount) : "",
    category: expense?.category ?? "FOOD",
    expenseDate: dayjs(expense?.expenseDate ?? defaultDate),
    paymentMethod: expense?.paymentMethod ?? "",
  };
}

function toInput(values: ExpenseFormValues): ExpenseInput {
  return {
    title: values.title.trim(),
    amount: Number(values.amount),
    category: values.category,
    expenseDate: values.expenseDate!.format("YYYY-MM-DD"), // required by validation
    paymentMethod: values.paymentMethod.trim() || null,
  };
}

type ExpenseFormProps = {
  expense?: Expense; // present = editing
  defaultDate: string; // for a new expense: today, or the trip's start if it hasn't begun
  currency: string | null;
  saving: boolean;
  deleting?: boolean;
  error: string | null;
  onSave: (input: ExpenseInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
};

// Inline add/edit form for the Expenses tab (same pattern as the itinerary's ActivityForm).
const ExpenseForm = ({ expense, defaultDate, currency, saving, deleting = false, error, onSave, onCancel, onDelete }: ExpenseFormProps) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormValues>({ defaultValues: toFormValues(expense, defaultDate) });
  const busy = saving || deleting;
  const idPrefix = expense ? `expense-${expense.expenseId}` : "expense-new";

  return (
    <Box
      component="form"
      noValidate
      aria-label={expense ? `Edit ${expense.title}` : "Add expense"}
      onSubmit={handleSubmit((values) => onSave(toInput(values)))}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !busy) onCancel();
      }}
      sx={{ bgcolor: "background.paper", borderRadius: 3, p: 2, boxShadow: 1, border: 1, borderColor: "brand.soft", display: "flex", flexDirection: "column", gap: 1.75 }}
    >
      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <TextField
          id={`${idPrefix}-title`}
          label="What was it?"
          placeholder="e.g. Dinner at Locavore"
          required
          autoFocus
          sx={{ flex: "2 1 220px" }}
          error={!!errors.title}
          helperText={errors.title?.message}
          {...register("title", {
            validate: (value) => value.trim() !== "" || "Add a title",
            maxLength: { value: 255, message: "Keep it under 255 characters" },
          })}
        />
        <TextField
          id={`${idPrefix}-amount`}
          label="Amount"
          type="number"
          placeholder="0"
          required
          sx={{ flex: "1 1 130px" }}
          error={!!errors.amount}
          helperText={errors.amount?.message}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start">{currencySymbol(currency ?? DEFAULT_CURRENCY)}</InputAdornment> },
            htmlInput: { min: 0, step: "any" },
          }}
          {...register("amount", { validate: (value) => (value !== "" && Number(value) > 0) || "Enter an amount above 0" })}
        />
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <TextField select id={`${idPrefix}-category`} label="Category" sx={{ flex: "1 1 150px" }} {...field}>
              {expenseCategoryOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.emoji} {option.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="expenseDate"
          control={control}
          rules={{ validate: (value) => (value?.isValid() ?? false) || "Pick a date" }}
          render={({ field, fieldState }) => (
            // Any date: things like flights are often paid for weeks before the trip.
            <DatePicker
              label="Date"
              value={field.value}
              onChange={field.onChange}
              inputRef={field.ref}
              sx={{ flex: "1 1 160px" }}
              slotProps={{ textField: { id: `${idPrefix}-date`, required: true, error: !!fieldState.error, helperText: fieldState.error?.message } }}
            />
          )}
        />
        <TextField
          id={`${idPrefix}-payment`}
          label="Paid with (optional)"
          placeholder="Card, cash, UPI…"
          sx={{ flex: "1 1 150px" }}
          error={!!errors.paymentMethod}
          helperText={errors.paymentMethod?.message}
          {...register("paymentMethod", { maxLength: { value: 255, message: "Keep it under 255 characters" } })}
        />
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
        {onDelete && (
          <Button color="error" onClick={onDelete} disabled={busy} sx={{ mr: "auto" }}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        )}
        <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
          <Button variant="outlined" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={busy}>
            {saving ? "Saving…" : expense ? "Save" : "Add"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
export default ExpenseForm;
