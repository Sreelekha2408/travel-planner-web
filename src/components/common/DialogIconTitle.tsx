import { Box, DialogTitle } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";

type DialogIconTitleProps = {
  id: string; // referenced by the Dialog's aria-labelledby
  icon: ReactNode;
  tone: "primary" | "warning" | "error";
  children: ReactNode;
};

// Dialog heading with a tinted icon circle on the same row as the title. The icon hints at
// what kind of dialog it is (red = destructive, amber = warning) before the text is read.
const DialogIconTitle = ({ id, icon, tone, children }: DialogIconTitleProps) => (
  <DialogTitle id={id} sx={{ display: "flex", alignItems: "center", gap: 1.5, fontSize: 18, fontWeight: 700, pt: 3, pb: 1.5 }}>
    <Box
      aria-hidden
      sx={{
        flexShrink: 0,
        width: 40,
        height: 40,
        borderRadius: "50%",
        bgcolor: (theme) => alpha(theme.palette[tone].main, 0.1),
        color: `${tone}.main`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        "& svg": { fontSize: 22 },
      }}
    >
      {icon}
    </Box>
    {/* minWidth 0 lets a long trip name wrap instead of pushing the dialog wider */}
    <Box component="span" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>{children}</Box>
  </DialogTitle>
);
export default DialogIconTitle;
