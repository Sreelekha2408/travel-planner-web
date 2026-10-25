import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import EditOutlined from "@mui/icons-material/EditOutlined";
import dayjs from "dayjs";
import { activityTypeOption, formatActivityTime } from "../../common/itineraryUtils";
import { formatBudget } from "../../common/tripUtils";
import type { ItineraryItem } from "../../services/itineraryService";

// One activity, after the design's .activity-item: time, emoji tile, title with
// location and notes underneath, cost on the right.
type ActivityRowProps = {
  item: ItineraryItem;
  currency: string | null;
  showDate?: boolean; // for items listed outside the day blocks
  onEdit: () => void;
};

const ActivityRow = ({ item, currency, showDate = false, onEdit }: ActivityRowProps) => {
  const type = activityTypeOption(item.activityType);
  const sub = [showDate ? dayjs(item.activityDate).format("MMM D, YYYY") : null, item.location, item.description].filter(Boolean).join(" · ");
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, bgcolor: "background.paper", borderRadius: 3, px: 1.75, py: 1.5, boxShadow: 1 }}>
      <Typography sx={{ width: 42, flexShrink: 0, pt: 0.75, fontSize: 11, fontWeight: 600, color: "primary.main" }}>
        {formatActivityTime(item.activityTime) ?? "—"}
      </Typography>
      <Box
        aria-hidden
        sx={{ width: 34, height: 34, borderRadius: 2.25, bgcolor: type.tile, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}
      >
        {type.emoji}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.title}</Typography>
        <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.25 }}>
          {/* The type is shown as text too, since the tile's emoji is hidden from screen readers */}
          {type.label}
          {sub && ` · ${sub}`}
        </Typography>
      </Box>
      {item.price > 0 && (
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", whiteSpace: "nowrap", pt: 0.5 }}>
          {formatBudget(item.price, currency)}
        </Typography>
      )}
      <Tooltip title="Edit">
        <IconButton size="small" aria-label={`Edit ${item.title}`} onClick={onEdit} sx={{ mt: -0.25, color: "text.secondary" }}>
          <EditOutlined sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
export default ActivityRow;
