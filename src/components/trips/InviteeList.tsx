import { Avatar, Box, IconButton, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import { avatarColors } from "../../common/theme";
import { colorIndex } from "../../common/tripUtils";

type InviteeListProps = {
  emails: string[];
  onRemove?: (email: string) => void; // omit for a read-only list
  disabled?: boolean; // e.g. while a removal is saving
};

// About four and a half rows: past that the list scrolls instead of growing, and the half
// row peeking out at the bottom shows there's more.
const MAX_LIST_HEIGHT = 250;

// Invited travellers as rows: initial avatar, email, status and an optional remove button.
const InviteeList = ({ emails, onRemove, disabled = false }: InviteeListProps) => {
  if (emails.length === 0) return null;

  return (
    <Box
      component="ul"
      aria-label="Invited travellers"
      sx={{
        listStyle: "none",
        m: 0,
        p: 0.5,
        border: 1,
        borderColor: "divider",
        borderRadius: 3,
        bgcolor: "background.default",
        maxHeight: MAX_LIST_HEIGHT,
        overflowY: "auto",
      }}
    >
      {emails.map((email) => {
        const color = avatarColors[colorIndex(email, avatarColors.length)];
        return (
          <Box component="li" key={email} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1.25, py: 1, borderRadius: 2 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: color.bg, color: color.fg, fontSize: 13, fontWeight: 700 }}>
              {email[0].toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography noWrap sx={{ fontSize: 14, fontWeight: 500 }}>
                {email}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Not sent yet</Typography>
            </Box>
            {onRemove && (
              <Tooltip title="Remove">
                {/* span: Tooltip needs an element that gets events even when the button is disabled */}
                <span>
                  <IconButton
                    size="small"
                    aria-label={`Remove ${email}`}
                    onClick={() => onRemove(email)}
                    disabled={disabled}
                    sx={{ color: "text.secondary", "&:hover": { color: "error.main", bgcolor: (theme) => alpha(theme.palette.error.main, 0.08) } }}
                  >
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
export default InviteeList;
