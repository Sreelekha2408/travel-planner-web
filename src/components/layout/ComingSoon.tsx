import { Box, Button, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

// Placeholder for menu items that aren't built yet (see the README roadmap).
const ComingSoon = ({ title }: { title: string }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
      <Typography component="h1" sx={{ fontSize: 24, fontWeight: 800 }}>{title}</Typography>
      <Box sx={{ bgcolor: "background.paper", borderRadius: 4, boxShadow: 1, p: 4, maxWidth: 520 }}>
        <Typography sx={{ fontWeight: 700, mb: 1 }}>Coming soon</Typography>
        <Typography sx={{ color: "text.secondary", mb: 2 }}>
          {title} isn't available yet. For now you can plan and manage your trips.
        </Typography>
        <Button component={RouterLink} to="/trips" variant="contained">Go to my trips</Button>
      </Box>
    </Box>
  );
};
export default ComingSoon;
