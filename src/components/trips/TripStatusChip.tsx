import { Chip } from "@mui/material";
import { colors } from "../../common/theme";
import type { TripStatus } from "../../common/tripUtils";

const statusStyles: Record<TripStatus, { label: string; color: string }> = {
  upcoming: { label: "Upcoming", color: colors.primaryDark },
  ongoing: { label: "Ongoing", color: colors.warning },
  completed: { label: "Completed", color: colors.success },
};

const TripStatusChip = ({ status }: { status: TripStatus }) => {
  const { label, color } = statusStyles[status];
  return (
    <Chip label={label} size="small" sx={{ bgcolor: colors.surface, color, fontSize: 11, fontWeight: 700, height: 24 }} />
  );
};
export default TripStatusChip;
