import { Box, ButtonBase, Typography } from "@mui/material";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { formatDateRange, getTripStatus, tripEmoji } from "../../common/tripUtils";
import type { Trip } from "../../services/tripService";
import TripStatusChip from "../trips/TripStatusChip";

// One trip in a "pick a trip" list (sidebar Itinerary and Expenses pages): emoji, name,
// status, destination and dates, a summary on the right, and a chevron.
const TripPickerRow = ({ trip, to, summary }: { trip: Trip; to: string; summary: ReactNode }) => (
  <ButtonBase
    component={RouterLink}
    to={to}
    sx={{
      width: "100%",
      justifyContent: "flex-start",
      textAlign: "left",
      gap: 1.75,
      bgcolor: "background.paper",
      borderRadius: 3.5,
      boxShadow: 1,
      px: 2,
      py: 1.75,
      transition: "box-shadow 0.15s",
      "&:hover": { boxShadow: 4 },
      "&:focus-visible": { outline: 2, outlineColor: "primary.main", outlineOffset: 2 },
    }}
  >
    <Box aria-hidden sx={{ width: 44, height: 44, borderRadius: "50%", bgcolor: "brand.soft", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
      {tripEmoji(trip)}
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography noWrap sx={{ fontSize: 15, fontWeight: 700 }}>{trip.title}</Typography>
        <TripStatusChip status={getTripStatus(trip)} />
      </Box>
      <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}>
        📍 {trip.destination} · 📅 {formatDateRange(trip.startDate, trip.endDate)}
      </Typography>
    </Box>
    <Box sx={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", textAlign: "right" }}>{summary}</Box>
    <ChevronRightRounded sx={{ color: "text.secondary" }} />
  </ButtonBase>
);
export default TripPickerRow;
