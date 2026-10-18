import { Avatar, Box, IconButton, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import type { ReactNode } from "react";
import { avatarColors } from "../../common/theme";
import { colorIndex } from "../../common/tripUtils";
import { useAuth } from "../../context/useAuth";
import { useNotify } from "../../context/useNotify";
import { useUpdateTrip } from "../../services/tripQueries";
import { toTripInput, type Trip } from "../../services/tripService";

// One person: avatar, name and role, after the design's "member-row".
const MemberRow = ({ avatar, name, role, action }: { avatar: ReactNode; name: string; role: string; action?: ReactNode }) => (
  <Box component="li" sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 0.75 }}>
    {avatar}
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography noWrap title={name} sx={{ fontSize: 13, fontWeight: 600 }}>{name}</Typography>
      <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{role}</Typography>
    </Box>
    {action}
  </Box>
);

const avatarSx = { width: 34, height: 34, fontSize: 13, fontWeight: 700 };

// "👥 Travellers" from the design's trip page: you as organiser, then everyone invited.
// Invites are added from the header's Share button; each can be removed here.
const TravellersCard = ({ trip }: { trip: Trip }) => {
  const auth = useAuth();
  const notify = useNotify();
  const updateTrip = useUpdateTrip(trip.tripId);
  // The API returns invites as a set (no order); alphabetical keeps the list stable.
  const invitees = [...trip.invitedEmails].sort();
  // Only the owner can open a trip (the API returns 404 otherwise), so the organiser is you.
  const organiser = auth.status === "authenticated" ? auth.user : null;

  // Removing is a normal trip update with that email left out. No confirmation: it's easy
  // to undo by inviting them again.
  const removeInvite = (email: string) => {
    updateTrip.mutate(
      { ...toTripInput(trip), invitedEmails: trip.invitedEmails.filter((e) => e !== email) },
      {
        onSuccess: () => notify.success(`Removed ${email}`),
        onError: (error) => notify.error(error.message || "Couldn't remove the invite. Please try again."),
      },
    );
  };

  return (
    <Box sx={{ bgcolor: "background.paper", borderRadius: 3.5, boxShadow: 1, p: 2.25 }}>
      <Typography component="h2" sx={{ fontSize: 14, fontWeight: 700, mb: 1 }}>👥 Travellers</Typography>
      {/* Scrolls after about six people instead of growing with every invite */}
      <Box component="ul" aria-label="Travellers" sx={{ listStyle: "none", m: 0, p: 0, maxHeight: 300, overflowY: "auto" }}>
        {organiser && (
          <MemberRow
            avatar={<Avatar sx={{ ...avatarSx, bgcolor: "primary.main" }}>{organiser.firstName[0]}{organiser.lastName[0]}</Avatar>}
            name={`${organiser.firstName} ${organiser.lastName}`}
            role="Organiser"
          />
        )}
        {invitees.map((email) => {
          const color = avatarColors[colorIndex(email, avatarColors.length)];
          return (
            <MemberRow
              key={email}
              avatar={<Avatar sx={{ ...avatarSx, bgcolor: color.bg, color: color.fg }}>{email[0].toUpperCase()}</Avatar>}
              name={email}
              role="Invited · not sent yet"
              action={
                <Tooltip title="Remove">
                  {/* span: Tooltip needs an element that gets events even when the button is disabled */}
                  <span>
                    <IconButton
                      size="small"
                      aria-label={`Remove ${email}`}
                      onClick={() => removeInvite(email)}
                      disabled={updateTrip.isPending}
                      sx={{ color: "text.secondary", "&:hover": { color: "error.main", bgcolor: (theme) => alpha(theme.palette.error.main, 0.08) } }}
                    >
                      <DeleteOutlined sx={{ fontSize: 18 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              }
            />
          );
        })}
      </Box>
    </Box>
  );
};
export default TravellersCard;
