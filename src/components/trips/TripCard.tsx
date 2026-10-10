import { Box, Card, CardActionArea, IconButton, ListItemIcon, Menu, MenuItem, Typography } from "@mui/material";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import MoreHoriz from "@mui/icons-material/MoreHoriz";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { colors } from "../../common/theme";
import { destinationCode, formatBudget, formatDateRange, getTripStatus, tripLengthInDays } from "../../common/tripUtils";
import type { Trip } from "../../services/tripService";
import TripStatusChip from "./TripStatusChip";

// The design's three cover gradients, picked by trip id so a card keeps its colour.
const coverGradients = [
  "linear-gradient(135deg, #5C6BC0 0%, #7E57C2 100%)",
  "linear-gradient(135deg, #E64A19 0%, #AD1457 100%)",
  "linear-gradient(135deg, #00796B 0%, #0277BD 100%)",
];

type TripCardProps = {
  trip: Trip;
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
};

const TripCard = ({ trip, onEdit, onDelete }: TripCardProps) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const days = tripLengthInDays(trip.startDate, trip.endDate);

  const closeMenu = () => setMenuAnchor(null);

  return (
    <Card sx={{ position: "relative", borderRadius: 4, boxShadow: colors.cardShadow }}>
      {/* The whole card links to the trip; the menu button sits outside the link
          because a button inside an <a> is invalid HTML and confuses screen readers. */}
      <CardActionArea component={RouterLink} to={`/trips/${trip.tripId}`}>
        <Box sx={{ height: 120, background: coverGradients[trip.tripId % coverGradients.length], position: "relative" }}>
          <Box sx={{ position: "absolute", top: 12, right: 12 }}>
            <TripStatusChip status={getTripStatus(trip)} />
          </Box>
          <Typography
            aria-hidden
            sx={{ position: "absolute", left: 16, bottom: 4, fontSize: 52, fontWeight: 800, letterSpacing: "0.04em", color: "rgba(255,255,255,0.38)", lineHeight: 1.1 }}
          >
            {destinationCode(trip.destination)}
          </Typography>
        </Box>
        <Box sx={{ p: 2, pr: 6 }}>
          <Typography noWrap sx={{ fontSize: 16, fontWeight: 700 }}>{trip.title}</Typography>
          <Typography noWrap sx={{ fontSize: 13, color: colors.textMuted, mt: 0.25 }}>{trip.destination}</Typography>
          <Typography component="div" sx={{ display: "flex", flexWrap: "wrap", columnGap: 1.75, rowGap: 0.5, mt: 1.25, fontSize: 12, color: colors.navText }}>
            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
            <span>{days} {days === 1 ? "day" : "days"}</span>
            <span>{formatBudget(trip.budget)}</span>
          </Typography>
        </Box>
      </CardActionArea>

      <IconButton
        aria-label={`Actions for ${trip.title}`}
        aria-haspopup="menu"
        onClick={(event) => setMenuAnchor(event.currentTarget)}
        size="small"
        sx={{ position: "absolute", right: 8, top: 132 }}
      >
        <MoreHoriz />
      </IconButton>
      <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={closeMenu}>
        <MenuItem onClick={() => { closeMenu(); onEdit(trip); }}>
          <ListItemIcon><EditOutlined fontSize="small" /></ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem onClick={() => { closeMenu(); onDelete(trip); }} sx={{ color: "error.main" }}>
          <ListItemIcon><DeleteOutlined fontSize="small" color="error" /></ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
};
export default TripCard;
