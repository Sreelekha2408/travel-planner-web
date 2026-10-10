import { colors } from "../../common/theme";

// Shared by the sign-in and create-account pages (design: 46px inputs, 11px radius,
// label above the field).
export const authLabelSx = { fontSize: 13, fontWeight: 600, color: colors.text, mb: 0.75 };

export const authInputSx = {
  "& .MuiOutlinedInput-root": { borderRadius: "11px", bgcolor: colors.surface },
  "& .MuiOutlinedInput-input": { height: 46, boxSizing: "border-box" as const, py: 0, fontSize: 14 },
};

export const authSubmitSx = { height: 48, borderRadius: "11px", fontSize: 15, fontWeight: 700, textTransform: "none" as const };

// Form side of the split screen.
export const authFormPanelSx = {
  flex: "1 1 480px",
  minWidth: 0,
  boxSizing: "border-box" as const,
  px: { xs: 3, sm: 8 },
  py: 6,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  bgcolor: colors.background,
};

// Brand side; hidden on small screens so phones get just the form.
export const authBrandPanelSx = {
  flex: "1 1 480px",
  minWidth: 0,
  boxSizing: "border-box" as const,
  px: 8,
  py: 6,
  color: colors.surface,
  display: { xs: "none", md: "flex" },
  flexDirection: "column" as const,
};
