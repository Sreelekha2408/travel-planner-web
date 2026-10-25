import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import EditOutlined from "@mui/icons-material/EditOutlined";
import dayjs from "dayjs";
import { expenseCategoryOption } from "../../common/expenseUtils";
import { formatBudget } from "../../common/tripUtils";
import type { Expense } from "../../services/expenseService";

// One transaction, after the design's .expense-row: category tile, title with date and
// category underneath, amount in orange (money going out), and an edit button.
const ExpenseRow = ({ expense, onEdit }: { expense: Expense; onEdit: () => void }) => {
  const category = expenseCategoryOption(expense.category);
  const sub = [dayjs(expense.expenseDate).format("MMM D"), category.label, expense.paymentMethod].filter(Boolean).join(" · ");
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, bgcolor: "background.paper", borderRadius: 3, px: 1.75, py: 1.5, boxShadow: 1 }}>
      <Box aria-hidden sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: category.tile, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
        {category.emoji}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{expense.title}</Typography>
        <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{sub}</Typography>
      </Box>
      <Typography sx={{ fontSize: 14, fontWeight: 800, color: "secondary.main", whiteSpace: "nowrap" }}>
        −{formatBudget(expense.amount, expense.currency)}
      </Typography>
      <Tooltip title="Edit">
        <IconButton size="small" aria-label={`Edit ${expense.title}`} onClick={onEdit} sx={{ color: "text.secondary" }}>
          <EditOutlined sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
export default ExpenseRow;
