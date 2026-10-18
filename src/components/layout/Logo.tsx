import { Box, Typography } from "@mui/material";
import NearMe from "@mui/icons-material/NearMe";

// "light" sits on a dark gradient (sign-in brand panel); "dark" on white or light grey.
const Logo = ({ variant = "dark" }: { variant?: "light" | "dark" }) => {
  const light = variant === "light";
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: "10px",
          bgcolor: light ? "brand.glass" : "primary.main",
          color: "common.white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <NearMe fontSize="small" />
      </Box>
      <Typography sx={{ fontSize: 16, fontWeight: 700, color: light ? "common.white" : "text.primary" }}>
        Travel<Box component="span" sx={{ color: light ? "brand.highlight" : "primary.main" }}>Plan</Box>
      </Typography>
    </Box>
  );
};
export default Logo;
