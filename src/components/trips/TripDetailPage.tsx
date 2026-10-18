import { Box, Button, Chip, Link, Skeleton, Tab, Tabs, Typography } from "@mui/material";
import ArrowBackIosNew from "@mui/icons-material/ArrowBackIosNew";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { Link as RouterLink, useParams } from "react-router-dom";
import { gradients } from "../../common/theme";
import { formatBudget, formatDateRange, formatTravellers, getTripStatus, tripLengthInDays, tripTypeLabel } from "../../common/tripUtils";
import { ApiError } from "../../services/serviceWrapper";
import { useTrip } from "../../services/tripQueries";
import type { Trip } from "../../services/tripService";
import { TripLoadError } from "./TripFormPage";
import TripStatusChip from "./TripStatusChip";

const headerBadgeSx = { bgcolor: "brand.glass", color: "common.white", fontWeight: 600, fontSize: 12 };

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 1.25, borderBottom: 1, borderColor: "divider", "&:last-of-type": { borderBottom: "none" } }}>
    <Typography sx={{ fontSize: 14, color: "text.secondary" }}>{label}</Typography>
    <Typography sx={{ fontSize: 14, fontWeight: 600, textAlign: "right" }}>{value}</Typography>
  </Box>
);

const TripDetail = ({ trip }: { trip: Trip }) => {
  const days = tripLengthInDays(trip.startDate, trip.endDate);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Link component={RouterLink} to="/trips" underline="hover" sx={{ fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 0.75, alignSelf: "flex-start" }}>
        <ArrowBackIosNew sx={{ fontSize: 12 }} />
        All trips
      </Link>

      <Box
        sx={{
          background: gradients.tripHeader,
          borderRadius: 4,
          p: { xs: 2.5, sm: 3.5 },
          color: "common.white",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {/* Wrapper stops the chip stretching across the flex column */}
          <Box sx={{ alignSelf: "flex-start" }}><TripStatusChip status={getTripStatus(trip)} /></Box>
          <Typography component="h1" sx={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em" }}>{trip.title}</Typography>
          <Typography sx={{ fontSize: 14, opacity: 0.9 }}>
            {formatDateRange(trip.startDate, trip.endDate)} · {days} {days === 1 ? "day" : "days"}
            {trip.travellers != null && ` · ${formatTravellers(trip.travellers)}`}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Chip label={trip.destination} size="small" sx={headerBadgeSx} />
            <Chip label={`Budget ${formatBudget(trip.budget)}`} size="small" sx={headerBadgeSx} />
          </Box>
        </Box>
        <Button
          component={RouterLink}
          to={`/trips/${trip.tripId}/edit`}
          startIcon={<EditOutlined />}
          sx={{ bgcolor: "brand.glass", color: "common.white", "&:hover": { bgcolor: "brand.glassStrong" } }}
        >
          Edit trip
        </Button>
      </Box>

      {/* Only Overview exists for now; the other tabs are placeholders for later phases. */}
      <Tabs value="overview" aria-label="Trip sections" variant="scrollable" scrollButtons={false}>
        <Tab value="overview" label="Overview" />
        {["Itinerary", "Expenses", "Packing"].map((label) => (
          <Tab key={label} value={label} disabled label={<span>{label} <Chip label="Soon" size="small" sx={{ height: 18, fontSize: 10, ml: 0.5 }} /></span>} />
        ))}
      </Tabs>

      <Box sx={{ bgcolor: "background.paper", borderRadius: 4, boxShadow: 1, p: 2.75, maxWidth: 560 }}>
        <Typography component="h2" sx={{ fontSize: 14, fontWeight: 700, mb: 1 }}>Trip details</Typography>
        <DetailRow label="From" value={trip.source ?? "Not set"} />
        <DetailRow label="Destination" value={trip.destination} />
        <DetailRow label="Dates" value={formatDateRange(trip.startDate, trip.endDate)} />
        <DetailRow label="Length" value={`${days} ${days === 1 ? "day" : "days"}`} />
        <DetailRow label="Budget" value={formatBudget(trip.budget)} />
        <DetailRow label="Travellers" value={formatTravellers(trip.travellers) ?? "Not set"} />
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, py: 1.25 }}>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>Trip type</Typography>
          {trip.tripTypes.length > 0 ? (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, justifyContent: "flex-end" }}>
              {trip.tripTypes.map((type) => <Chip key={type} label={tripTypeLabel(type)} size="small" />)}
            </Box>
          ) : (
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Not set</Typography>
          )}
        </Box>
      </Box>

      {trip.invitedEmails.length > 0 && (
        <Box sx={{ bgcolor: "background.paper", borderRadius: 4, boxShadow: 1, p: 2.75, maxWidth: 560 }}>
          <Typography component="h2" sx={{ fontSize: 14, fontWeight: 700, mb: 0.5 }}>Invited travellers</Typography>
          <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1.5 }}>
            Saved with the trip. Invites aren't sent yet: that comes with Shared trips.
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {trip.invitedEmails.map((email) => <Chip key={email} label={email} variant="outlined" />)}
          </Box>
        </Box>
      )}
    </Box>
  );
};

const TripDetailLoader = ({ tripId }: { tripId: number }) => {
  const { data: trip, isPending, isError, error } = useTrip(tripId);
  if (isPending) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }} aria-busy="true" aria-label="Loading trip">
        <Skeleton variant="rounded" height={170} sx={{ borderRadius: 4 }} />
        <Skeleton variant="rounded" height={240} sx={{ borderRadius: 4, maxWidth: 560 }} />
      </Box>
    );
  }
  if (isError) return <TripLoadError error={error} />;
  return <TripDetail trip={trip} />;
};

const TripDetailPage = () => {
  const id = Number(useParams().tripId);
  if (!Number.isInteger(id)) return <TripLoadError error={new ApiError(404, "Not found")} />;
  return <TripDetailLoader tripId={id} />;
};
export default TripDetailPage;
