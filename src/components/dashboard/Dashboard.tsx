import { Box, Drawer, List, ListItem, ListItemButton, ListItemText, Typography } from "@mui/material";
import { useState } from "react";
import { Fragment } from "react/jsx-runtime";

const Dashboard = () => {
  const [open, setOpen] = useState(true);
  return (
    <Fragment>
      <Drawer
        anchor="left"
        variant="permanent"
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        sx={{
          "& .MuiDrawer-paper": {
            width: "18%",
            bgcolor: "yellow",
          },
        }}
      >
          <Typography variant="h3">TravelPlan</Typography>
          <Typography>Menu</Typography>
          <List>
            {['Dashboard', 'My Trips', 'Itinerary', 'Expenses', 'Packing List', 'Shared Trips'].map((text, index) => (
              <ListItem key={text} disablePadding>
                <ListItemButton>
                  {/* <ListItemIcon>
                  {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                </ListItemIcon> */}
                  <ListItemText primary={text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
      </Drawer>
      <h1 style={{ marginLeft: "20%"}}>Cards</h1>
    </Fragment>
  )
}
export default Dashboard;