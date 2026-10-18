import { Box, Typography } from "@mui/material";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import type { ReactNode } from "react";
import { Navigate, useLocation, type Location } from "react-router-dom";
import { gradients } from "../../common/theme";
import { useAuth } from "../../context/useAuth";
import Logo from "../layout/Logo";
import SignInForm from "./SignInForm";
import { authBrandPanelSx, authFormPanelSx } from "./styles";

const features: { icon: ReactNode; text: string }[] = [
  { icon: <CalendarMonthOutlined fontSize="small" />, text: "Day-by-day itineraries with flights, stays and activities" },
  { icon: <AccountBalanceWalletOutlined fontSize="small" />, text: "A budget tracker that shows what is left, in real time" },
  { icon: <GroupOutlined fontSize="small" />, text: "Shared trips, so everyone sees the same plan" },
];

const BrandPanel = () => (
  <Box sx={{ ...authBrandPanelSx, background: gradients.signInPanel, justifyContent: "space-between", gap: 5 }}>
    <Logo variant="light" />

    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5, maxWidth: 520 }}>
      {/* A <p>, not a heading: this panel is hidden on phones, and the form's
          "Welcome back" is the page's <h1>. */}
      <Typography sx={{ fontSize: 44, lineHeight: 1.12, fontWeight: 800, letterSpacing: "-0.02em" }}>
        Every trip, planned in one place.
      </Typography>
      <Typography sx={{ fontSize: 16, lineHeight: 1.6, color: "brand.onDark" }}>
        Build day-by-day itineraries, keep your budget honest and share the plan with the people you are travelling with.
      </Typography>
      <Box component="ul" sx={{ display: "flex", flexDirection: "column", gap: 1.75, listStyle: "none", m: 0, p: 0 }}>
        {features.map((feature) => (
          <Box component="li" key={feature.text} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: "9px", bgcolor: "brand.glass", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {feature.icon}
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{feature.text}</Typography>
          </Box>
        ))}
      </Box>
    </Box>

    {/* Decorative sample trip, as in the design */}
    <Box aria-hidden sx={{ bgcolor: "brand.glass", borderRadius: 4, p: 2.25, maxWidth: 420, display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700 }}>Bali Escape</Typography>
        <Typography sx={{ fontSize: 12, color: "brand.onDark" }}>Dec 12 – Dec 22</Typography>
      </Box>
      <Box sx={{ height: 6, borderRadius: 3, bgcolor: "brand.glassStrong" }}>
        <Box sx={{ width: "75%", height: 6, borderRadius: 3, bgcolor: "brand.highlight" }} />
      </Box>
      <Typography sx={{ fontSize: 12, color: "brand.onDark" }}>75% planned · 2 travellers</Typography>
    </Box>
  </Box>
);

export const SignIn = () => {
  const auth = useAuth();
  const location = useLocation();

  // Covers both a successful sign-in and visiting /signin while already signed in.
  if (auth.status === "authenticated") {
    const from = (location.state as { from?: Location } | null)?.from?.pathname ?? "/dashboard";
    return <Navigate to={from} replace />;
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexWrap: "wrap" }}>
      <BrandPanel />
      <Box component="main" sx={authFormPanelSx}>
        <SignInForm />
      </Box>
    </Box>
  );
};
