import { Box, Skeleton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useQueries } from "@tanstack/react-query";
import dayjs from "dayjs";
import type { ReactNode } from "react";
import { spentByCurrency } from "../../common/expenseUtils";
import { formatBudget, tripStats } from "../../common/tripUtils";
import { expenseKeys } from "../../services/expenseQueries";
import { getExpenses } from "../../services/expenseService";
import type { Trip } from "../../services/tripService";

type Tone = "green" | "blue" | "orange";

// The design's .stat-card: emoji, big value, label, and a small coloured badge.
const StatCard = ({ emoji, value, label, badge, tone }: { emoji: string; value: ReactNode; label: string; badge?: string; tone: Tone }) => (
  <Box component="li" sx={{ bgcolor: "background.paper", borderRadius: 3.5, boxShadow: 1, px: 2.5, pt: 2.5, pb: 2 }}>
    <Box aria-hidden sx={{ fontSize: 22, mb: 1.25 }}>{emoji}</Box>
    <Box sx={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>{value}</Box>
    <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.5 }}>{label}</Typography>
    {badge && (
      <Box
        component="span"
        sx={(theme) => {
          const color = { green: theme.palette.success.main, blue: theme.palette.primary.main, orange: theme.palette.secondary.main }[tone];
          return { display: "inline-block", mt: 1, px: 1, py: 0.25, borderRadius: 5, fontSize: 10, fontWeight: 600, color, bgcolor: alpha(color, 0.12) };
        }}
      >
        {badge}
      </Box>
    )}
  </Box>
);

// Dashboard stats, after the design: total trips, upcoming, total spent and completed.
// Spending is shown per currency: trips in different currencies are never added up.
const StatCards = ({ trips }: { trips: Trip[] }) => {
  const stats = tripStats(trips);
  // Same cache entries as each trip's Expenses tab and the Expenses page.
  const expenseQueries = useQueries({
    queries: trips.map((trip) => ({ queryKey: expenseKeys.trip(trip.tripId), queryFn: () => getExpenses(trip.tripId) })),
  });
  const expensesLoading = expenseQueries.some((query) => query.isPending);
  const expensesByTrip = new Map(trips.map((trip, i) => [trip.tripId, expenseQueries[i]?.data ?? []]));
  const spending = spentByCurrency(trips, expensesByTrip);

  const spentValue = expensesLoading ? (
    <Skeleton width={90} />
  ) : spending.length === 0 ? (
    formatBudget(0, trips[0]?.currency ?? null)
  ) : (
    // One line per currency; smaller when there are several so the card keeps its height.
    <Box sx={{ fontSize: spending.length > 1 ? 18 : 26 }}>
      {spending.map(({ currency, spent }) => (
        <Box key={currency}>{formatBudget(spent, currency)}</Box>
      ))}
    </Box>
  );
  const spentBadge = spending.length === 1 && spending[0].percent != null ? `${spending[0].percent}% of budget` : spending.length > 1 ? `Across ${spending.length} currencies` : undefined;

  return (
    <Box component="ul" aria-label="Trip stats" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
      <StatCard emoji="🌍" value={stats.total} label="Total trips" badge={stats.startingThisYear ? `+${stats.startingThisYear} this year` : undefined} tone="green" />
      <StatCard
        emoji="✈️"
        value={stats.upcoming}
        label="Upcoming"
        badge={stats.nextStartDate ? `Next: ${dayjs(stats.nextStartDate).format("MMM D")}` : undefined}
        tone="blue"
      />
      <StatCard emoji="💸" value={spentValue} label="Total spent" badge={spentBadge} tone="orange" />
      <StatCard
        emoji="✅"
        value={stats.completed}
        label="Completed trips"
        badge={stats.daysTravelled ? `${stats.daysTravelled} ${stats.daysTravelled === 1 ? "day" : "days"} travelled` : undefined}
        tone="green"
      />
    </Box>
  );
};
export default StatCards;
