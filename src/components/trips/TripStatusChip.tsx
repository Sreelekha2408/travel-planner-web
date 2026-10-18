import { Chip } from "@mui/material";
import type { TripStatus } from "../../common/tripUtils";

const statusStyles: Record<TripStatus, { label: string; color: string }> = {
  upcoming: { label: "Upcoming", color: "primary.dark" },
  ongoing: { label: "Ongoing", color: "warning.main" },
  completed: { label: "Completed", color: "success.main" },
};

const TripStatusChip = ({ status }: { status: TripStatus }) => {
  const { label, color } = statusStyles[status];
  return (
    <Chip label={label} size="small" sx={{ bgcolor: "background.paper", color, fontSize: 11, fontWeight: 700, height: 24 }} />
  );
};
export default TripStatusChip;
