import { Avatar, Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import CheckBoxOutlined from "@mui/icons-material/CheckBoxOutlined";
import GridViewOutlined from "@mui/icons-material/GridViewOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import LuggageOutlined from "@mui/icons-material/LuggageOutlined";
import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { colors } from "../../common/theme";
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

// Layout route: sidebar + the current page (<Outlet />) for every signed-in screen.
const AppLayout = () => {
  const auth = useAuth();
  // Rendered inside ProtectedRoute, so this is always "authenticated" in practice.
  const user = auth.status === "authenticated" ? auth.user : null;
  const initials = user ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() : "";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: colors.background, color: colors.text }}>
      <Box
        component="nav"
        aria-label="Main"
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
          bgcolor: colors.surface,
          borderRight: `1px solid ${colors.border}`,
          display: "flex",
          flexDirection: "column",
          pt: 3.5,
          pb: 2.5,
          position: "sticky",
          top: 0,
          height: "100vh",
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ px: 2.75, pb: 3.25 }}>
          <Logo />
        </Box>

        <Typography
          sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: colors.textMuted, px: 2.75, pb: 1 }}
        >
          Menu
        </Typography>

        {navItems.map((item) => (
          <Box
            key={item.to}
            component={NavLink}
            to={item.to}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2.75,
              py: 1.375,
              // A plain <a> inherits the browser's serif font; use MUI's (Phase 4 sets it globally).
              fontFamily: (theme) => theme.typography.fontFamily,
              fontSize: 14,
              fontWeight: 500,
              color: colors.navText,
              textDecoration: "none",
              borderRight: "3px solid transparent",
              "&:hover": { bgcolor: colors.background },
              // NavLink adds the "active" class when the URL matches (also for /trips/123).
              "&.active": {
                bgcolor: colors.primaryLight,
                color: colors.primaryDark,
                fontWeight: 600,
                borderRightColor: colors.primary,
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

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 2.75, pt: 1.75, borderTop: `1px solid ${colors.border}` }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: colors.primary, fontSize: 13, fontWeight: 700 }}>{initials}</Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>{user?.firstName}</Typography>
            <Typography noWrap sx={{ fontSize: 12, color: colors.textMuted }}>{user?.email}</Typography>
          </Box>
          <Tooltip title="Sign out">
            <IconButton aria-label="Sign out" size="small" onClick={() => auth.signOut()}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box component="main" sx={{ flex: 1, minWidth: 0, px: 4.5, py: 4 }}>
        <Outlet />
      </Box>
    </Box>
  );
};
export default AppLayout;
