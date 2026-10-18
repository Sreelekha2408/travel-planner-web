import { Box, CircularProgress } from "@mui/material";

// Shown while a lazily loaded page (or the session check) is loading.
const PageLoader = ({ fullScreen = false }: { fullScreen?: boolean }) => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: fullScreen ? "100vh" : 240 }}>
    <CircularProgress aria-label="Loading" />
  </Box>
);
export default PageLoader;
