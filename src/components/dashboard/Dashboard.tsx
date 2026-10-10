import { Box, Button, Typography } from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import { Link as RouterLink } from "react-router-dom";
import { colors } from "../../common/theme";
import { useAuth } from "../../context/useAuth";

const Dashboard = () => {
  const auth = useAuth();
  const firstName = auth.status === "authenticated" ? auth.user.firstName : "";

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
      <Box>
        <Typography component="h1" sx={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" }}>
          Welcome back, {firstName}
        </Typography>
        <Typography sx={{ fontSize: 14, color: colors.textMuted, mt: 0.5 }}>
          Here's what's happening with your trips.
        </Typography>
      </Box>
      <Button component={RouterLink} to="/trips/new" variant="contained" startIcon={<AddRounded />}>
        New trip
      </Button>
    </Box>
  );
};
export default Dashboard;
