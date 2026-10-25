import { Alert, Box, Button, Skeleton, Typography } from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import { useQueries } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { totalSpent } from "../../common/expenseUtils";
import { formatBudget, sortTrips } from "../../common/tripUtils";
import { expenseKeys } from "../../services/expenseQueries";
import { getExpenses } from "../../services/expenseService";
import { useTrips } from "../../services/tripQueries";
import type { Trip } from "../../services/tripService";
import TripPickerRow from "../common/TripPickerRow";

// "€1,172 of €2,200" (or just "€1,172 spent" without a budget), orange like the design's amounts.
const SpentSummary = ({ trip, spent }: { trip: Trip; spent: number | undefined }) => {
  if (spent === undefined) return <Box component="span" sx={{ color: "text.secondary" }}>…</Box>;
  if (spent === 0) return <Box component="span" sx={{ color: "text.secondary" }}>Nothing spent yet</Box>;
  return (
    <Box component="span">
      <Box component="span" sx={{ color: "secondary.main", fontWeight: 700 }}>{formatBudget(spent, trip.currency)}</Box>
      <Box component="span" sx={{ color: "text.secondary", fontWeight: 500 }}>
        {trip.budget != null ? ` of ${formatBudget(trip.budget, trip.currency)}` : " spent"}
      </Box>
    </Box>
  );
};

// The sidebar's "Expenses": pick a trip to see and add its expenses. Each trip's expenses
// are fetched for the totals; the same cache entries are reused when you open the trip.
const ExpensesPage = () => {
  const { data: trips, isPending, isError, error, refetch } = useTrips();
  const spentTotals = useQueries({
    queries: (trips ?? []).map((trip) => ({
      queryKey: expenseKeys.trip(trip.tripId),
      queryFn: () => getExpenses(trip.tripId),
      select: totalSpent,
    })),
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 820 }}>
      <Box>
        <Typography component="h1" sx={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" }}>Expenses</Typography>
        <Typography sx={{ fontSize: 14, color: "text.secondary", mt: 0.5 }}>Pick a trip to track what you spend.</Typography>
      </Box>

      {isPending && (
        <Box aria-busy="true" aria-label="Loading trips" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={76} sx={{ borderRadius: 3.5 }} />)}
        </Box>
      )}
      {isError && (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}>
          Couldn't load your trips. {error.message}
        </Alert>
      )}
      {trips && trips.length === 0 && (
        <Box sx={{ bgcolor: "background.paper", borderRadius: 4, boxShadow: 1, p: 4, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1.5 }}>
          <Typography sx={{ fontWeight: 700 }}>No trips yet</Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 14 }}>Create a trip first, then track its expenses here.</Typography>
          <Button component={RouterLink} to="/trips/new" variant="contained" startIcon={<AddRounded />}>New trip</Button>
        </Box>
      )}
      {trips && trips.length > 0 && (
        <Box component="ul" aria-label="Trips" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
          {sortTrips(trips).map((trip) => (
            <li key={trip.tripId}>
              <TripPickerRow trip={trip} to={`/trips/${trip.tripId}/expenses`} summary={<SpentSummary trip={trip} spent={spentTotals[trips.indexOf(trip)]?.data} />} />
            </li>
          ))}
        </Box>
      )}
    </Box>
  );
};
export default ExpensesPage;
