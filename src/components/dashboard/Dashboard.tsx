import { Box, Drawer, List, ListItem, ListItemButton, ListItemText, Typography } from "@mui/material";

const drawerWidth = 240;

const Dashboard = () => {
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
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1 }}>
        <h1>Cards</h1>
      </Box>
    </Box>
  );
};
export default Dashboard;
