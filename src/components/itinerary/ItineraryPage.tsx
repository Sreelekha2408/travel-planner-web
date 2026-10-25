import { Alert, Box, Button, Skeleton, Typography } from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import { useQueries } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { sortTrips } from "../../common/tripUtils";
import { itineraryKeys } from "../../services/itineraryQueries";
import { getItinerary } from "../../services/itineraryService";
import { useTrips } from "../../services/tripQueries";
import TripPickerRow from "../common/TripPickerRow";

const ActivityCount = ({ count }: { count: number | undefined }) => (
  <Box component="span" sx={{ color: count ? "primary.main" : "text.secondary" }}>
    {count === undefined ? "…" : count === 0 ? "No activities yet" : `${count} ${count === 1 ? "activity" : "activities"}`}
  </Box>
);

// The sidebar's "Itinerary": pick a trip to plan. Each trip's itinerary is fetched to show
// how many activities it has; the same cache entries are reused when you open the trip.
const ItineraryPage = () => {
  const { data: trips, isPending, isError, error, refetch } = useTrips();
  const counts = useQueries({
    queries: (trips ?? []).map((trip) => ({
      queryKey: itineraryKeys.trip(trip.tripId),
      queryFn: () => getItinerary(trip.tripId),
      select: (items: unknown[]) => items.length,
    })),
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 820 }}>
      <Box>
        <Typography component="h1" sx={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" }}>Itinerary</Typography>
        <Typography sx={{ fontSize: 14, color: "text.secondary", mt: 0.5 }}>Pick a trip to plan its days.</Typography>
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
          <Typography sx={{ color: "text.secondary", fontSize: 14 }}>Create a trip first, then plan it day by day here.</Typography>
          <Button component={RouterLink} to="/trips/new" variant="contained" startIcon={<AddRounded />}>New trip</Button>
        </Box>
      )}
      {trips && trips.length > 0 && (
        // Ongoing first, then upcoming, then past trips, same as My trips.
        <Box component="ul" aria-label="Trips" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
          {sortTrips(trips).map((trip) => (
            <li key={trip.tripId}>
              <TripPickerRow
                trip={trip}
                to={`/trips/${trip.tripId}/itinerary`}
                summary={<ActivityCount count={counts[trips.indexOf(trip)]?.data} />}
              />
            </li>
          ))}
        </Box>
      )}
    </Box>
  );
};
export default ItineraryPage;
