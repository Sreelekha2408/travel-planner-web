import { Box, Button, Chip, Link, Skeleton, Tab, Tabs, Typography } from "@mui/material";
import ArrowBackIosNew from "@mui/icons-material/ArrowBackIosNew";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { Link as RouterLink, useParams } from "react-router-dom";
import { colors } from "../../common/theme";
import { formatBudget, formatDateRange, getTripStatus, tripLengthInDays } from "../../common/tripUtils";
import { ApiError } from "../../services/serviceWrapper";
import { useTrip } from "../../services/tripQueries";
import type { Trip } from "../../services/tripService";
import { TripLoadError } from "./TripFormPage";
import TripStatusChip from "./TripStatusChip";

const headerBadgeSx = { bgcolor: "rgba(255,255,255,0.2)", color: colors.surface, fontWeight: 600, fontSize: 12 };

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 1.25, borderBottom: `1px solid ${colors.border}`, "&:last-of-type": { borderBottom: "none" } }}>
    <Typography sx={{ fontSize: 14, color: colors.textMuted }}>{label}</Typography>
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
          background: `linear-gradient(135deg, ${colors.primaryMid} 0%, #7E57C2 100%)`,
          borderRadius: 4,
          p: { xs: 2.5, sm: 3.5 },
          color: colors.surface,
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
          sx={{ bgcolor: "rgba(255,255,255,0.2)", color: colors.surface, "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}
        >
          Edit trip
        </Button>
      </Box>

      {/* Only Overview exists for now; the other tabs are placeholders for later phases. */}
      <Tabs value="overview" aria-label="Trip sections">
        <Tab value="overview" label="Overview" />
        {["Itinerary", "Expenses", "Packing"].map((label) => (
          <Tab key={label} value={label} disabled label={<span>{label} <Chip label="Soon" size="small" sx={{ height: 18, fontSize: 10, ml: 0.5 }} /></span>} />
        ))}
      </Tabs>

      <Box sx={{ bgcolor: colors.surface, borderRadius: 4, boxShadow: colors.cardShadow, p: 2.75, maxWidth: 560 }}>
        <Typography component="h2" sx={{ fontSize: 14, fontWeight: 700, mb: 1 }}>Trip details</Typography>
        <DetailRow label="From" value={trip.source ?? "Not set"} />
        <DetailRow label="Destination" value={trip.destination} />
        <DetailRow label="Dates" value={formatDateRange(trip.startDate, trip.endDate)} />
        <DetailRow label="Length" value={`${days} ${days === 1 ? "day" : "days"}`} />
        <DetailRow label="Budget" value={formatBudget(trip.budget)} />
      </Box>
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
