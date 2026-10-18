import { Box, Chip, IconButton, Link, Skeleton, Tab, Tabs, Tooltip, Typography } from "@mui/material";
import ArrowBackIosNew from "@mui/icons-material/ArrowBackIosNew";
import { useState, type ReactNode } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { gradients } from "../../common/theme";
import {
  formatBudget,
  formatDateRange,
  formatTravellers,
  getTripStatus,
  sortTripTypes,
  tripCountdown,
  tripEmoji,
  tripLengthInDays,
  tripTypeWithEmoji,
} from "../../common/tripUtils";
import { ApiError } from "../../services/serviceWrapper";
import { useTrip } from "../../services/tripQueries";
import type { Trip } from "../../services/tripService";
import { TripLoadError } from "./TripFormPage";
import ShareTripDialog from "./ShareTripDialog";
import TravellersCard from "./TravellersCard";
import TripStatusChip from "./TripStatusChip";

const headerBadgeSx = { bgcolor: "brand.glass", color: "common.white", fontWeight: 600, fontSize: 13, height: 28, px: 0.5 };

// One row of the details card: emoji, muted label, value on the right.
const DetailRow = ({ emoji, label, children }: { emoji: string; label: string; children: ReactNode }) => (
  <Box
    component="li"
    sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.25, borderBottom: 1, borderColor: "divider", "&:last-of-type": { borderBottom: "none" } }}
  >
    <Box component="span" aria-hidden sx={{ fontSize: 18, width: 24, textAlign: "center", flexShrink: 0 }}>{emoji}</Box>
    <Typography sx={{ fontSize: 14, color: "text.secondary", flex: 1, whiteSpace: "nowrap" }}>{label}</Typography>
    <Box sx={{ fontSize: 14, fontWeight: 600, textAlign: "right" }}>{children}</Box>
  </Box>
);

const cardSx = { bgcolor: "background.paper", borderRadius: 4, boxShadow: 1, p: 2.75 };

// The design's 36px emoji squares in the top-right corner, on white tiles so the emoji's
// colours stand out against the indigo header.
const headerIconButtonSx = {
  width: 36,
  height: 36,
  borderRadius: 2.5,
  fontSize: 17,
  // IconButton's default colour is 54%-opacity black, and browsers apply that opacity to
  // colour emoji too, which makes them look faded. Any opaque colour avoids it.
  color: "primary.dark",
  bgcolor: "common.white",
  boxShadow: "0 2px 6px rgba(26, 35, 126, 0.25)",
  "&:hover": { bgcolor: "brand.soft" },
};

const TripDetail = ({ trip }: { trip: Trip }) => {
  const [shareOpen, setShareOpen] = useState(false);
  const days = tripLengthInDays(trip.startDate, trip.endDate);
  const length = `${days} ${days === 1 ? "day" : "days"}`;
  const travellers = formatTravellers(trip.travellers);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Link component={RouterLink} to="/trips" underline="hover" sx={{ fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 0.75, alignSelf: "flex-start" }}>
        <ArrowBackIosNew sx={{ fontSize: 12 }} />
        All trips
      </Link>

      {/* Header, after the design's trip detail screen: big trip emoji, name, status and
          countdown, then emoji badges for the key facts. */}
      <Box
        sx={{
          background: gradients.tripHeader,
          borderRadius: 4,
          p: { xs: 2.5, sm: 3.5 },
          color: "common.white",
          position: "relative", // anchors the action buttons top-right, as in the design
        }}
      >
        {/* Phones: emoji on top (sharing the row with the buttons), text below.
            Wider: emoji beside the text, with room kept on the right for the buttons. */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2.5,
            minWidth: 0,
            pr: { sm: 12 },
          }}
        >
          <Box
            aria-hidden
            sx={{ width: { xs: 64, sm: 84 }, height: { xs: 64, sm: 84 }, borderRadius: "50%", bgcolor: "brand.glass", display: "flex", alignItems: "center", justifyContent: "center", fontSize: { xs: 34, sm: 44 }, flexShrink: 0 }}
          >
            {tripEmoji(trip)}
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
              <TripStatusChip status={getTripStatus(trip)} />
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "brand.onDark" }}>{tripCountdown(trip)}</Typography>
            </Box>
            <Typography component="h1" sx={{ fontSize: { xs: 24, sm: 30 }, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
              {trip.title}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Chip label={`📅 ${formatDateRange(trip.startDate, trip.endDate)} · ${length}`} size="small" sx={headerBadgeSx} />
              <Chip label={`📍 ${trip.destination}`} size="small" sx={headerBadgeSx} />
              {trip.budget != null && <Chip label={`💰 ${formatBudget(trip.budget, trip.currency)}`} size="small" sx={headerBadgeSx} />}
              {travellers && <Chip label={`👥 ${travellers}`} size="small" sx={headerBadgeSx} />}
            </Box>
          </Box>
        </Box>
        {/* Edit + Share as emoji squares, top-right as in the design */}
        <Box sx={{ position: "absolute", top: { xs: 20, sm: 24 }, right: { xs: 20, sm: 24 }, display: "flex", gap: 1 }}>
          <Tooltip title="Edit trip">
            <IconButton component={RouterLink} to={`/trips/${trip.tripId}/edit`} aria-label="Edit trip" sx={headerIconButtonSx}>
              <span aria-hidden>✏️</span>
            </IconButton>
          </Tooltip>
          <Tooltip title="Share trip">
            <IconButton onClick={() => setShareOpen(true)} aria-label="Share trip" sx={headerIconButtonSx}>
              <span aria-hidden>🔗</span>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Only Overview exists for now; the other tabs are placeholders for later phases. */}
      <Tabs value="overview" aria-label="Trip sections" variant="scrollable" scrollButtons={false}>
        <Tab value="overview" label="Overview" />
        {["Itinerary", "Expenses", "Packing"].map((label) => (
          <Tab key={label} value={label} disabled label={<span>{label} <Chip label="Soon" size="small" sx={{ height: 18, fontSize: 10, ml: 0.5 }} /></span>} />
        ))}
      </Tabs>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 280px" }, gap: 3, alignItems: "start" }}>
        <Box sx={cardSx}>
          <Typography component="h2" sx={{ fontSize: 15, fontWeight: 700, mb: 1 }}>Trip details</Typography>
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
            <DetailRow emoji="🛫" label="From">{trip.source ?? "Not set"}</DetailRow>
            <DetailRow emoji="📍" label="Destination">{trip.destination}</DetailRow>
            <DetailRow emoji="📅" label="Dates">{formatDateRange(trip.startDate, trip.endDate)}</DetailRow>
            <DetailRow emoji="⏱️" label="Length">{length}</DetailRow>
            <DetailRow emoji="💰" label="Budget">{formatBudget(trip.budget, trip.currency)}</DetailRow>
            <DetailRow emoji="👥" label="Travellers">{travellers ?? "Not set"}</DetailRow>
            <DetailRow emoji="🏷️" label="Trip type">
              {trip.tripTypes.length > 0 ? (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, justifyContent: "flex-end" }}>
                  {sortTripTypes(trip.tripTypes).map((type) => (
                    <Chip key={type} label={tripTypeWithEmoji(type)} size="small" sx={{ bgcolor: "brand.soft", color: "primary.dark", fontWeight: 600 }} />
                  ))}
                </Box>
              ) : (
                "Not set"
              )}
            </DetailRow>
          </Box>
        </Box>

        <TravellersCard trip={trip} />
      </Box>

      {/* key: remount on open so the dialog starts from the saved invites */}
      <ShareTripDialog key={String(shareOpen)} trip={trip} open={shareOpen} onClose={() => setShareOpen(false)} />
    </Box>
  );
};

const TripDetailLoader = ({ tripId }: { tripId: number }) => {
  const { data: trip, isPending, isError, error } = useTrip(tripId);
  if (isPending) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }} aria-busy="true" aria-label="Loading trip">
        <Skeleton variant="rounded" height={170} sx={{ borderRadius: 4 }} />
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 4 }} />
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
