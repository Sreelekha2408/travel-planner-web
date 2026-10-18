import { Box, Typography } from "@mui/material";
import FlightTakeoff from "@mui/icons-material/FlightTakeoff";
import HotelOutlined from "@mui/icons-material/HotelOutlined";
import RestaurantOutlined from "@mui/icons-material/RestaurantOutlined";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { gradients, activityColors } from "../../common/theme";
import { useAuth } from "../../context/useAuth";
import { authBrandPanelSx, authFormPanelSx } from "../signin/styles";
import SignUpForm from "./SignUpForm";

const previewItems: { icon: ReactNode; iconBg: string; title: string; subtitle: string; price: string }[] = [
  { icon: <FlightTakeoff fontSize="small" sx={{ color: activityColors.flight.icon }} />, iconBg: activityColors.flight.tile, title: "Flight to Ngurah Rai", subtitle: "08:45 · Economy", price: "$380" },
  { icon: <HotelOutlined fontSize="small" sx={{ color: activityColors.hotel.icon }} />, iconBg: activityColors.hotel.tile, title: "Check in at Alaya Resort", subtitle: "15:00 · Ubud", price: "$220" },
  { icon: <RestaurantOutlined fontSize="small" sx={{ color: activityColors.food.icon }} />, iconBg: activityColors.food.tile, title: "Dinner at Locavore", subtitle: "19:30 · Reservation confirmed", price: "$65" },
];

const BrandPanel = () => (
  <Box sx={{ ...authBrandPanelSx, background: gradients.signUpPanel, justifyContent: "center", gap: 4 }}>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75, maxWidth: 480 }}>
      <Typography sx={{ fontSize: 38, lineHeight: 1.15, fontWeight: 800, letterSpacing: "-0.02em" }}>
        Start with a destination. We will help with the rest.
      </Typography>
      <Typography sx={{ fontSize: 16, lineHeight: 1.6, color: "brand.onWarm" }}>
        Add flights, hotels and things to do as you find them. TravelPlan lines them up by day and keeps a running total.
      </Typography>
    </Box>

    {/* Decorative mini itinerary, as in the design */}
    <Box aria-hidden sx={{ bgcolor: "background.paper", borderRadius: "18px", p: 2.5, maxWidth: 440, color: "text.primary", display: "flex", flexDirection: "column", gap: 1.5, boxShadow: 4 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "primary.main" }}>
        Day 1 · Thursday
      </Typography>
      {previewItems.map((item) => (
        <Box key={item.title} sx={{ display: "flex", alignItems: "center", gap: 1.5, bgcolor: "background.default", borderRadius: 3, px: 1.5, py: 1.25 }}>
          <Box sx={{ width: 34, height: 34, borderRadius: "9px", bgcolor: item.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {item.icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.title}</Typography>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{item.subtitle}</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{item.price}</Typography>
        </Box>
      ))}
    </Box>
  </Box>
);

const SignUp = () => {
  const auth = useAuth();
  // After sign-up the form signs in; once authenticated, go to the dashboard.
  if (auth.status === "authenticated") return <Navigate to="/dashboard" replace />;

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexWrap: "wrap" }}>
      <Box component="main" sx={authFormPanelSx}>
        <SignUpForm />
      </Box>
      <BrandPanel />
    </Box>
  );
};
export default SignUp;
