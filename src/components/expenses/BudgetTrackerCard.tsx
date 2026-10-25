import { Box, Link, Skeleton, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { budgetUsage, totalSpent } from "../../common/expenseUtils";
import { budgetColors } from "../../common/theme";
import { formatBudget } from "../../common/tripUtils";
import { useExpenses } from "../../services/expenseQueries";
import type { Trip } from "../../services/tripService";

// The design's "💰 Budget Tracker" on the trip page: spent vs budget as a bar.
const BudgetTrackerCard = ({ trip }: { trip: Trip }) => {
  const { data: expenses, isPending, isError } = useExpenses(trip.tripId);
  const usage = budgetUsage(totalSpent(expenses ?? []), trip.budget);
  const money = (amount: number) => formatBudget(amount, trip.currency);

  return (
    <Box component="section" aria-labelledby="budget-tracker" sx={{ bgcolor: "background.paper", borderRadius: 3.5, boxShadow: 1, p: 2.25 }}>
      <Typography id="budget-tracker" component="h2" sx={{ fontSize: 14, fontWeight: 700, mb: 1.5 }}>💰 Budget tracker</Typography>
      {isPending ? (
        <Skeleton variant="rounded" height={40} />
      ) : isError ? (
        <Typography sx={{ fontSize: 13, color: "text.secondary" }}>Couldn't load the expenses.</Typography>
      ) : usage.budget == null ? (
        <>
          <Typography sx={{ fontSize: 13 }}>
            <Box component="span" sx={{ fontWeight: 700, color: "secondary.main" }}>{money(usage.spent)}</Box> spent
          </Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.5 }}>
            No budget set.{" "}
            <Link component={RouterLink} to={`/trips/${trip.tripId}/edit`}>Add one</Link> to track it here.
          </Typography>
        </>
      ) : (
        <>
          <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 12, mb: 0.5 }}>
            <Box component="span" sx={{ fontWeight: 700, color: usage.over ? budgetColors.over : "secondary.main" }}>{money(usage.spent)} spent</Box>
            <Box component="span" sx={{ color: "text.secondary" }}>{money(usage.budget)} total</Box>
          </Box>
          <Box
            role="progressbar"
            aria-label="Budget used"
            aria-valuenow={usage.percent ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${money(usage.spent)} of ${money(usage.budget)} spent`}
            sx={{ height: 8, borderRadius: 5, bgcolor: budgetColors.remaining, overflow: "hidden" }}
          >
            <Box sx={{ height: "100%", width: `${usage.percent}%`, borderRadius: 5, background: usage.over ? budgetColors.over : budgetColors.spent }} />
          </Box>
          <Typography sx={{ fontSize: 12, mt: 1, color: usage.over ? budgetColors.over : "text.secondary", fontWeight: usage.over ? 600 : 400 }}>
            {usage.over ? `${money(-usage.remaining!)} over budget` : `${money(usage.remaining!)} left`}
          </Typography>
        </>
      )}
    </Box>
  );
};
export default BudgetTrackerCard;
