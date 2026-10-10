import { Box, Button, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const NotFound = () => {
  return (
    <Box
      component="main"
      sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 2 }}
    >
      <Typography component="h1" variant="h4" sx={{ fontWeight: "bold" }}>Page not found</Typography>
      <Typography>The page you're looking for doesn't exist.</Typography>
      <Button component={RouterLink} to="/" variant="contained">Go home</Button>
    </Box>
  );
};
export default NotFound;
