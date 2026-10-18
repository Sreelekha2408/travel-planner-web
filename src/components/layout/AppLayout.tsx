import { Avatar, Box, Chip, Drawer, IconButton, Tooltip, Typography } from "@mui/material";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import CheckBoxOutlined from "@mui/icons-material/CheckBoxOutlined";
import GridViewOutlined from "@mui/icons-material/GridViewOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import LuggageOutlined from "@mui/icons-material/LuggageOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import { useState, type ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import Logo from "./Logo";

const sidebarWidth = 240;

type NavItem = { label: string; to: string; icon: ReactNode; comingSoon?: boolean };

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: <GridViewOutlined fontSize="small" /> },
  { label: "My trips", to: "/trips", icon: <LuggageOutlined fontSize="small" /> },
  { label: "Itinerary", to: "/itinerary", icon: <CalendarMonthOutlined fontSize="small" />, comingSoon: true },
  { label: "Expenses", to: "/expenses", icon: <AccountBalanceWalletOutlined fontSize="small" />, comingSoon: true },
  { label: "Packing list", to: "/packing", icon: <CheckBoxOutlined fontSize="small" />, comingSoon: true },
  { label: "Shared trips", to: "/shared", icon: <GroupOutlined fontSize="small" />, comingSoon: true },
];

// The sidebar's contents, shared by the permanent sidebar (wide screens) and the
// slide-in drawer (small screens). onNavigate closes the drawer after a link is chosen.
const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const auth = useAuth();
  // Rendered inside ProtectedRoute, so this is always "authenticated" in practice.
  const user = auth.status === "authenticated" ? auth.user : null;
  const initials = user ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() : "";

  return (
    <Box component="nav" aria-label="Main" sx={{ display: "flex", flexDirection: "column", height: "100%", pt: 3.5, pb: 2.5, boxSizing: "border-box" }}>
      <Box sx={{ px: 2.75, pb: 3.25 }}>
        <Logo />
      </Box>

      <Typography
        sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "text.secondary", px: 2.75, pb: 1 }}
      >
        Menu
      </Typography>

      {navItems.map((item) => (
        <Box
          key={item.to}
          component={NavLink}
          to={item.to}
          onClick={onNavigate}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2.75,
            py: 1.375,
            fontSize: 14,
            fontWeight: 500,
            color: "brand.nav",
            textDecoration: "none",
            borderRight: "3px solid transparent",
            "&:hover": { bgcolor: "background.default" },
            // NavLink adds the "active" class when the URL matches (also for /trips/123).
            "&.active": {
              bgcolor: "brand.soft",
              color: "primary.dark",
              fontWeight: 600,
              borderRightColor: "primary.main",
            },
          }}
        >
          {item.icon}
          {item.label}
          {item.comingSoon && (
            <Chip label="Soon" size="small" sx={{ ml: "auto", height: 20, fontSize: 10, fontWeight: 600 }} />
          )}
        </Box>
      ))}

      <Box sx={{ flex: 1 }} />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 2.75, pt: 1.75, borderTop: 1, borderColor: "divider" }}>
        <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: 13, fontWeight: 700 }}>{initials}</Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>{user?.firstName}</Typography>
          <Typography noWrap sx={{ fontSize: 12, color: "text.secondary" }}>{user?.email}</Typography>
        </Box>
        <Tooltip title="Sign out">
          <IconButton aria-label="Sign out" size="small" onClick={() => auth.signOut()}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

// Layout route: sidebar + the current page (<Outlet />) for every signed-in screen.
// Visibility is switched with CSS breakpoints (display: { xs, md }), not JS, so there's
// no flash of the wrong layout on first render.
const AppLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
      {/* Wide screens: permanent sidebar */}
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          width: sidebarWidth,
          flexShrink: 0,
          bgcolor: "background.paper",
          borderRight: 1,
          borderColor: "divider",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <SidebarContent />
      </Box>

      {/* Small screens: the same sidebar slides in over the page */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ display: { md: "none" }, "& .MuiDrawer-paper": { width: sidebarWidth } }}
      >
        <SidebarContent onNavigate={() => setDrawerOpen(false)} />
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Small screens: top bar with the menu button */}
        <Box
          component="header"
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            gap: 1,
            px: 1,
            py: 1,
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
            position: "sticky",
            top: 0,
            zIndex: (theme) => theme.zIndex.appBar,
          }}
        >
          <IconButton aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Logo />
        </Box>

        <Box component="main" sx={{ flex: 1, px: { xs: 2, sm: 3, md: 4.5 }, py: { xs: 3, md: 4 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};
export default AppLayout;
