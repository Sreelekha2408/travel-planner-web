import { Box, Button, Typography } from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import { Link as RouterLink } from "react-router-dom";
import { greeting, tripsSummary } from "../../common/tripUtils";
import { useAuth } from "../../context/useAuth";
import { useTrips } from "../../services/tripQueries";
import TripGrid from "../trips/TripGrid";

const Dashboard = () => {
  const auth = useAuth();
  const firstName = auth.status === "authenticated" ? auth.user.firstName : "";
  // Same query as the trip grid below, so this doesn't make a second request.
  const { data: trips } = useTrips();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography component="h1" sx={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" }}>
            {greeting()}, {firstName} 👋
          </Typography>
          {/* minHeight keeps the header from jumping when the trips arrive */}
          <Typography sx={{ fontSize: 14, color: "text.secondary", mt: 0.5, minHeight: 21 }}>
            {trips ? tripsSummary(trips) : ""}
          </Typography>
        </Box>
        <Button component={RouterLink} to="/trips/new" variant="contained" startIcon={<AddRounded />}>
          New trip
        </Button>
      </Box>

      <Box component="section" aria-labelledby="dashboard-trips" sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Typography id="dashboard-trips" component="h2" sx={{ fontSize: 16, fontWeight: 700 }}>My trips</Typography>
          <Button component={RouterLink} to="/trips" size="small">View all</Button>
        </Box>
        <TripGrid limit={3} />
      </Box>
    </Box>
  );
};
export default Dashboard;
