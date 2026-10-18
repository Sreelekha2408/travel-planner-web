import { Alert, Box, Button, Link, Skeleton, Typography } from "@mui/material";
import ArrowBackIosNew from "@mui/icons-material/ArrowBackIosNew";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../services/serviceWrapper";
import { useCreateTrip, useTrip, useUpdateTrip } from "../../services/tripQueries";
import type { Trip } from "../../services/tripService";
import TripForm from "./TripForm";

const PageHeader = ({ title, subtitle, backTo, backLabel }: { title: string; subtitle: string; backTo: string; backLabel: string }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
    <Link component={RouterLink} to={backTo} underline="hover" sx={{ fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 0.75, alignSelf: "flex-start" }}>
      <ArrowBackIosNew sx={{ fontSize: 12 }} />
      {backLabel}
    </Link>
    <Typography component="h1" sx={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" }}>{title}</Typography>
    <Typography sx={{ fontSize: 14, color: "text.secondary" }}>{subtitle}</Typography>
  </Box>
);

const NewTrip = () => {
  const navigate = useNavigate();
  const createTrip = useCreateTrip();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PageHeader
        title="Plan a new trip"
        subtitle="Start with the basics. You can add flights, stays and activities afterwards."
        backTo="/trips"
        backLabel="Back to trips"
      />
      <TripForm
        submitLabel="Create trip"
        submittingLabel="Creating…"
        onSubmit={async (input) => {
          const trip = await createTrip.mutateAsync(input);
          navigate(`/trips/${trip.tripId}`);
        }}
      />
    </Box>
  );
};

const EditTrip = ({ tripId }: { tripId: number }) => {
  const navigate = useNavigate();
  const { data: trip, isPending, isError, error } = useTrip(tripId);
  const updateTrip = useUpdateTrip(tripId);

  if (isPending) return <Skeleton variant="rounded" height={420} sx={{ borderRadius: 4 }} />;
  if (isError) return <TripLoadError error={error} />;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PageHeader title="Edit trip" subtitle={trip.title} backTo={`/trips/${trip.tripId}`} backLabel="Back to trip" />
      <TripForm
        trip={trip}
        submitLabel="Save changes"
        submittingLabel="Saving…"
        onSubmit={async (input) => {
          const saved: Trip = await updateTrip.mutateAsync(input);
          navigate(`/trips/${saved.tripId}`);
        }}
      />
    </Box>
  );
};

// Shared by the edit and detail pages.
export const TripLoadError = ({ error }: { error: Error }) => {
  const notFound = error instanceof ApiError && error.status === 404;
  return (
    <Alert
      severity={notFound ? "info" : "error"}
      action={<Button component={RouterLink} to="/trips" color="inherit" size="small">My trips</Button>}
    >
      {notFound ? "This trip doesn't exist, or it belongs to someone else." : `Couldn't load the trip. ${error.message}`}
    </Alert>
  );
};

// /trips/new and /trips/:tripId/edit share this page.
const TripFormPage = () => {
  const { tripId } = useParams();
  if (tripId === undefined) return <NewTrip />;
  const id = Number(tripId);
  if (!Number.isInteger(id)) return <TripLoadError error={new ApiError(404, "Not found")} />;
  return <EditTrip tripId={id} />;
};
export default TripFormPage;
