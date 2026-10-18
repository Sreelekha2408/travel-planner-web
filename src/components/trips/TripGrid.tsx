import { Alert, Box, Button, Skeleton, Typography } from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { sortTrips } from "../../common/tripUtils";
import { useNotify } from "../../context/useNotify";
import { useTrips } from "../../services/tripQueries";
import type { Trip } from "../../services/tripService";
import DeleteTripDialog from "./DeleteTripDialog";
import TripCard from "./TripCard";

const gridSx = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 2 };

// Trip cards with loading, error and empty states. Used by My trips (all trips)
// and the Dashboard (`limit` = next few trips).
const TripGrid = ({ limit }: { limit?: number }) => {
  const navigate = useNavigate();
  const notify = useNotify();
  const { data: trips, isPending, isError, error, refetch, isFetching } = useTrips();
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);

  if (isPending) {
    return (
      <Box sx={gridSx} aria-busy="true" aria-label="Loading trips">
        {Array.from({ length: limit ?? 3 }, (_, i) => (
          <Skeleton key={i} variant="rounded" height={230} sx={{ borderRadius: 4 }} />
        ))}
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert
        severity="error"
        action={<Button color="inherit" size="small" onClick={() => refetch()} disabled={isFetching}>Retry</Button>}
      >
        Couldn't load your trips. {error.message}
      </Alert>
    );
  }

  if (trips.length === 0) {
    return (
      <Box sx={{ bgcolor: "background.paper", borderRadius: 4, boxShadow: 1, p: 5, textAlign: "center" }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>No trips yet</Typography>
        <Typography sx={{ color: "text.secondary", mt: 1, mb: 3 }}>
          Plan your first trip: add a destination and dates, and the rest can come later.
        </Typography>
        <Button component={RouterLink} to="/trips/new" variant="contained" startIcon={<AddRounded />}>
          Plan a trip
        </Button>
      </Box>
    );
  }

  const visibleTrips = sortTrips(trips).slice(0, limit);

  return (
    <>
      <Box sx={gridSx}>
        {visibleTrips.map((trip) => (
          <TripCard
            key={trip.tripId}
            trip={trip}
            onEdit={(t) => navigate(`/trips/${t.tripId}/edit`)}
            onDelete={setTripToDelete}
          />
        ))}
      </Box>
      <DeleteTripDialog
        trip={tripToDelete}
        onClose={() => setTripToDelete(null)}
        onDeleted={(t) => {
          setTripToDelete(null);
          notify.success(`“${t.title}” was deleted`);
        }}
      />
    </>
  );
};
export default TripGrid;
