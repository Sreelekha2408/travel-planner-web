import { Box, Button, Drawer, List, ListItem, ListItemButton, ListItemText, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../../context/useAuth";

const drawerWidth = 240;

const Dashboard = () => {
  const auth = useAuth();
  // Rendered inside ProtectedRoute, so this is always "authenticated" in practice.
  const userName = auth.status === "authenticated" ? auth.user.name : "";

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        anchor="left"
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "yellow",
          },
        }}
      >
        <Typography variant="h3">TravelPlan</Typography>
        <Typography>Menu</Typography>
        <List>
          {['Dashboard', 'My Trips', 'Itinerary', 'Expenses', 'Packing List', 'Shared Trips'].map((text) => (
            <ListItem key={text} disablePadding>
              <ListItemButton>
                <ListItemText primary={text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ mt: "auto", p: 2 }}>
          <Typography sx={{ fontWeight: "bold", mb: 1 }}>{userName}</Typography>
          <Button variant="outlined" startIcon={<LogoutIcon />} onClick={() => auth.signOut()} fullWidth>
            Sign out
          </Button>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1 }}>
        <h1>Cards</h1>
      </Box>
    </Box>
  );
};
export default Dashboard;
