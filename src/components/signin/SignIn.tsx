import Grid from "@mui/material/Grid";
import { loginStyles } from "./styles";
import loginImg from "../../assets/login-img.png";
import { Box, Paper } from "@mui/material";
import SignInForm from "./SignInForm";

export const SignIn = () => {
  const { container, imgContainer, paperStyle, loginContainer } = loginStyles;
  return (
    <Paper sx={paperStyle}>
      <Grid container spacing={0} sx={container}>
        <Grid size={6} sx={{ height: "100%" }}>
          <img src={loginImg} style={imgContainer} />
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
