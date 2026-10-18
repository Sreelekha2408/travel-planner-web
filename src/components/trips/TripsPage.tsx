import { Box, Button, Typography } from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import { Link as RouterLink } from "react-router-dom";
import TripGrid from "./TripGrid";

const TripsPage = () => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography component="h1" sx={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" }}>My trips</Typography>
          <Typography sx={{ fontSize: 14, color: "text.secondary", mt: 0.5 }}>
            Everything you're planning, happening now, and already done.
          </Typography>
        </Box>
        <Button component={RouterLink} to="/trips/new" variant="contained" startIcon={<AddRounded />}>
          New trip
        </Button>
      </Box>
      <TripGrid />
    </Box>
  );
};
export default TripsPage;
