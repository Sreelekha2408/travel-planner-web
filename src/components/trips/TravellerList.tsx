import { Avatar, Box, IconButton, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import type { ReactNode } from "react";
import { avatarColors } from "../../common/theme";
import { colorIndex } from "../../common/tripUtils";
import { useAuth } from "../../context/useAuth";

const ROW_AVATAR = 34;

// An invitee's avatar: first letter of the email on its own colour (same email, same
// colour everywhere). Also used, smaller, in the trip summary's avatar stack.
export const InviteeAvatar = ({ email, size = ROW_AVATAR }: { email: string; size?: number }) => {
  const color = avatarColors[colorIndex(email, avatarColors.length)];
  return (
    <Avatar sx={{ width: size, height: size, bgcolor: color.bg, color: color.fg, fontSize: Math.round(size * 0.4), fontWeight: 700 }}>
      {email[0].toUpperCase()}
    </Avatar>
  );
};

// One person, after the design's "member-row": avatar, name and role, optional action.
const TravellerRow = ({ avatar, name, role, action }: { avatar: ReactNode; name: string; role: string; action?: ReactNode }) => (
  <Box component="li" sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 0.75 }}>
    {avatar}
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography noWrap title={name} sx={{ fontSize: 13, fontWeight: 600 }}>{name}</Typography>
      <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{role}</Typography>
    </Box>
    {action}
  </Box>
);

type TravellerListProps = {
  emails: string[];
  onRemove?: (email: string) => void; // omit for a read-only list
  removeDisabled?: boolean; // e.g. while a removal is saving
  maxHeight: number; // past this the list scrolls instead of growing
};

// Who's on the trip: you as organiser (only the owner can open or edit a trip), then
// everyone invited. Used on the trip page, in the Share dialog and in the trip form.
const TravellerList = ({ emails, onRemove, removeDisabled = false, maxHeight }: TravellerListProps) => {
  const auth = useAuth();
  const organiser = auth.status === "authenticated" ? auth.user : null;

  return (
    <Box component="ul" aria-label="Travellers" sx={{ listStyle: "none", m: 0, p: 0, maxHeight, overflowY: "auto" }}>
      {organiser && (
        <TravellerRow
          avatar={
            <Avatar sx={{ width: ROW_AVATAR, height: ROW_AVATAR, bgcolor: "primary.main", fontSize: 13, fontWeight: 700 }}>
              {organiser.firstName[0]}
              {organiser.lastName[0]}
            </Avatar>
          }
          name={`${organiser.firstName} ${organiser.lastName}`}
          role="Organiser"
        />
      )}
      {emails.map((email) => (
        <TravellerRow
          key={email}
          avatar={<InviteeAvatar email={email} />}
          name={email}
          role="Invited · not sent yet"
          action={
            onRemove && (
              <Tooltip title="Remove">
                {/* span: Tooltip needs an element that gets events even when the button is disabled */}
                <span>
                  <IconButton
                    size="small"
                    aria-label={`Remove ${email}`}
                    onClick={() => onRemove(email)}
                    disabled={removeDisabled}
                    sx={{ color: "text.secondary", "&:hover": { color: "error.main", bgcolor: (theme) => alpha(theme.palette.error.main, 0.08) } }}
                  >
                    <DeleteOutlined sx={{ fontSize: 18 }} />
                  </IconButton>
                </span>
              </Tooltip>
            )
          }
        />
      ))}
    </Box>
  );
};
export default TravellerList;
