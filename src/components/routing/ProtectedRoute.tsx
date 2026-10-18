import { Box, CircularProgress } from "@mui/material";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// Layout route: wraps every page that requires a signed-in user.
const ProtectedRoute = () => {
  const auth = useAuth();
  const location = useLocation();

  // Wait for /users/me; redirecting now would bounce a logged-in user to sign-in on refresh.
  if (auth.status === "loading") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress aria-label="Checking your session" />
      </Box>
    );
  }

  if (auth.status === "unauthenticated") {
    // Remember where the user was going so sign-in can send them back.
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
export default ProtectedRoute;
