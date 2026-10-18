import { Box, Card, CardActionArea, IconButton, ListItemIcon, Menu, MenuItem, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import MoreHoriz from "@mui/icons-material/MoreHoriz";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { gradients } from "../../common/theme";
import { destinationCode, formatBudget, formatDateRange, formatTravellers, getTripStatus } from "../../common/tripUtils";
import type { Trip } from "../../services/tripService";
import TripStatusChip from "./TripStatusChip";


type TripCardProps = {
  trip: Trip;
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
};

const TripCard = ({ trip, onEdit, onDelete }: TripCardProps) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const travellers = formatTravellers(trip.travellers);

  const closeMenu = () => setMenuAnchor(null);

  return (
    <Card sx={{ position: "relative", borderRadius: 4, boxShadow: 1 }}>
      {/* The whole card links to the trip; the menu button sits outside the link
          because a button inside an <a> is invalid HTML and confuses screen readers. */}
      <CardActionArea component={RouterLink} to={`/trips/${trip.tripId}`}>
        <Box sx={{ height: 120, background: gradients.tripCovers[trip.tripId % gradients.tripCovers.length] /* picked by id so a card keeps its colour */, position: "relative" }}>
          <Box sx={{ position: "absolute", top: 12, right: 12 }}>
            <TripStatusChip status={getTripStatus(trip)} />
          </Box>
          <Typography
            aria-hidden
            sx={{ position: "absolute", left: 16, bottom: 4, fontSize: 52, fontWeight: 800, letterSpacing: "0.04em", color: "brand.watermark", lineHeight: 1.1 }}
          >
            {destinationCode(trip.destination)}
          </Typography>
        </Box>
        <Box sx={{ p: 2, pr: 6 }}>
          <Typography noWrap sx={{ fontSize: 16, fontWeight: 700 }}>{trip.title}</Typography>
          <Typography noWrap sx={{ fontSize: 13, color: "text.secondary", mt: 0.25 }}>{trip.destination}</Typography>
          <Typography component="div" sx={{ display: "flex", flexWrap: "wrap", columnGap: 1.75, rowGap: 0.5, mt: 1.25, fontSize: 12, color: "brand.nav" }}>
            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
            {travellers && <span>{travellers}</span>}
            <span>{formatBudget(trip.budget, trip.currency)}</span>
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
      <Menu
        anchorEl={menuAnchor}
        open={menuAnchor !== null}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }} // opens under the ⋯ button, right-aligned
        slotProps={{ paper: { sx: { minWidth: 168 } } }}
      >
        <MenuItem onClick={() => { closeMenu(); onEdit(trip); }}>
          <ListItemIcon><EditOutlined fontSize="small" /></ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => { closeMenu(); onDelete(trip); }}
          sx={{ color: "error.main", "&:hover": { bgcolor: (theme) => alpha(theme.palette.error.main, 0.08) } }}
        >
          <ListItemIcon><DeleteOutlined fontSize="small" color="error" /></ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
};
export default TripCard;
