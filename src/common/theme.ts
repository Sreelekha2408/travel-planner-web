import { createTheme, type Shadows } from "@mui/material/styles";
// Adds MUI X component names (MuiPickerDay, MuiPickersInputBase…) to the theme's types.
import type {} from "@mui/x-date-pickers/themeAugmentation";

// Extra design colours that don't fit MUI's standard palette slots. Module augmentation
// makes them part of the theme's types, so `theme.palette.brand.soft` and
// `sx={{ bgcolor: "brand.soft" }}` are checked like built-in colours.
type BrandPalette = {
  soft: string; // light indigo: active nav item, icon tiles
  nav: string; // sidebar link text
  body: string; // secondary body copy (checkbox labels, tips)
  onDark: string; // muted text on indigo panels
  onWarm: string; // muted text on the orange sign-up panel
  highlight: string; // "Plan" in the logo and the progress bar on dark panels
  glass: string; // translucent white on gradients (badges, icon tiles)
  glassStrong: string; // stronger translucent white (hover, progress track)
  watermark: string; // big faded letters on trip covers
  meterTrack: string; // empty password-strength bar
  meterWeak: string;
  meterFair: string;
};

declare module "@mui/material/styles" {
  interface Palette {
    brand: BrandPalette;
  }
  interface PaletteOptions {
    brand?: BrandPalette;
  }
}

// Illustration gradients from the design. They're artwork rather than UI colours,
// so they live here as named constants next to the palette.
export const gradients = {
  signInPanel: "linear-gradient(145deg, #283593 0%, #3949AB 55%, #5C6BC0 100%)",
  signUpPanel: "linear-gradient(145deg, #D84315 0%, #E64A19 40%, #3949AB 130%)",
  tripSummary: "linear-gradient(135deg, #3949AB 0%, #5C6BC0 100%)",
  tripHeader: "linear-gradient(135deg, #5C6BC0 0%, #7E57C2 100%)",
  tripCovers: [
    "linear-gradient(135deg, #5C6BC0 0%, #7E57C2 100%)",
    "linear-gradient(135deg, #E64A19 0%, #AD1457 100%)",
    "linear-gradient(135deg, #00796B 0%, #0277BD 100%)",
  ],
};

// Icon tile colours for itinerary items (sign-up preview now, Itinerary page later).
export const activityColors = {
  flight: { icon: "#3949AB", tile: "#E8EAF6" },
  hotel: { icon: "#1565C0", tile: "#E3F2FD" },
  food: { icon: "#B85C00", tile: "#FFF3E0" },
};

const base = createTheme();

export const theme = createTheme({
  palette: {
    primary: { main: "#3949AB", dark: "#283593", light: "#5C6BC0", contrastText: "#FFFFFF" },
    secondary: { main: "#FF7043" },
    success: { main: "#2E7D32" },
    warning: { main: "#BF360C" },
    text: { primary: "#1A1A2E", secondary: "#5B6270" },
    background: { default: "#F7F8FC", paper: "#FFFFFF" },
    divider: "#E5E7EB",
    brand: {
      soft: "#E8EAF6",
      nav: "#4B5160",
      body: "#3F4553",
      onDark: "#DDE1F7",
      onWarm: "#FFE9E1",
      highlight: "#FFAB91",
      glass: "rgba(255, 255, 255, 0.16)",
      glassStrong: "rgba(255, 255, 255, 0.28)",
      watermark: "rgba(255, 255, 255, 0.38)",
      meterTrack: "#DDDFE9",
      meterWeak: "#E65100",
      meterFair: "#F9A825",
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    button: { textTransform: "none", fontWeight: 600 }, // the design uses normal-case buttons
  },
  // [1] = the design's soft card shadow (used by Card/Paper elevation 1);
  // [4] = the lifted preview card on the sign-up panel.
  shadows: base.shadows.map((shadow, index) => {
    if (index === 1) return "0 2px 12px rgba(92, 107, 192, 0.10)";
    if (index === 4) return "0 12px 40px rgba(26, 26, 46, 0.25)";
    return shadow;
  }) as Shadows,
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 11 },
        // MUI's default hover for transparent buttons is a 4% tint, barely visible.
        // Use the design's soft indigo and a solid border instead.
        outlined: ({ theme }) => ({
          borderColor: theme.palette.brand.meterTrack,
          "&:hover": { backgroundColor: theme.palette.brand.soft, borderColor: theme.palette.primary.main },
        }),
        text: ({ theme }) => ({
          "&:hover": { backgroundColor: theme.palette.brand.soft },
        }),
      },
    },
    // The design's fields are 46px tall with 14px text (MUI's defaults are 56px and 16px).
    // Text inputs, selects and date pickers all get the same font, letter spacing and
    // padding (13px + ~20px line height + 13px = 46px), and the floating label is
    // re-centred to match.
    MuiInputBase: {
      styleOverrides: { root: { fontSize: 14, letterSpacing: "normal" } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 11 },
        input: { paddingTop: 13, paddingBottom: 13 },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: 14 },
        outlined: {
          "&:not(.MuiInputLabel-shrink)": { transform: "translate(14px, 13px) scale(1)" },
        },
      },
    },
    // Date pickers render their own field (not OutlinedInput). The outlined variant sets the
    // padding on its sections container, so the override has to come from its root.
    MuiPickersOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 11,
          "& .MuiPickersInputBase-sectionsContainer": { paddingTop: 13, paddingBottom: 13 },
        },
      },
    },
    // The calendar button inside date fields uses the primary indigo (MUI default: grey).
    MuiPickersInputBase: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: 14,
          letterSpacing: "normal", // body1's spacing made dates look larger than other values
          "& .MuiInputAdornment-root .MuiIconButton-root": {
            color: theme.palette.primary.main,
            "&:hover": { backgroundColor: theme.palette.brand.soft },
          },
        }),
      },
    },
    // Today's date in the calendar uses the theme's primary colour instead of grey.
    MuiPickerDay: {
      styleOverrides: {
        root: ({ theme }) => ({
          "&.MuiPickerDay-today:not(.Mui-selected)": {
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            fontWeight: 700,
            backgroundColor: theme.palette.brand.soft,
          },
        }),
      },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: "none", fontWeight: 600 } },
    },
  },
});
