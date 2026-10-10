import Grid from "@mui/material/Grid";
import { loginStyles } from "./styles";
import loginImg from "../../assets/login-img.png";
import { Box, Paper } from "@mui/material";
import SignInForm from "./SignInForm";
import { Navigate, useLocation, type Location } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export const SignIn = () => {
  const { container, imgContainer, paperStyle, loginContainer } = loginStyles;
  const auth = useAuth();
  const location = useLocation();

  // Covers both a successful sign-in and visiting /signin while already signed in.
  if (auth.status === "authenticated") {
    const from = (location.state as { from?: Location } | null)?.from?.pathname ?? "/dashboard";
    return <Navigate to={from} replace />;
  }

  return (
    <Paper sx={paperStyle}>
      <Grid container spacing={0} sx={container}>
        <Grid size={6} sx={{ height: "100%" }}>
          <img src={loginImg} alt="" style={imgContainer} />
        </Grid>
        <Grid size={6} sx={{ height: "100%" }}>
          <Box sx={loginContainer}>
            <SignInForm />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};
