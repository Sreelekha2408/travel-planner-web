import { Apple, Google, PersonOutlined } from "@mui/icons-material";
import { Button, Divider, Grid, InputAdornment, InputLabel, Link, Typography } from "@mui/material";
import TextField from "@mui/material/TextField";
import { useForm } from "react-hook-form";
import LoginIcon from '@mui/icons-material/Login';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { signIn } from "../../services/authenticationService";

type SignInFormValues = {
  username: string;
  password: string;
};

const SignInForm = () => {

  const { register, handleSubmit, formState: { errors } } = useForm<SignInFormValues>();

  return (
    <form onSubmit={handleSubmit((data) => {
      signIn(data)
    })}
      style={{
        width: "100%"
      }}
    >
      <Grid container>
        <Grid size={12} sx={{ mb: 8 }}>
          <Typography component="h1" sx={{ fontSize: 42, fontWeight: "bold" }}>Welcome back!</Typography>
          <Typography sx={{ fontSize: 18 }}>Sign in to continue your journey</Typography>
        </Grid>
        <Grid size={12} sx={{ mb: 4 }}>
          <InputLabel htmlFor="signin-username" sx={{ fontWeight: "bold", mb: 1 }}>Username</InputLabel>
          <TextField id="signin-username" variant="outlined"
            autoComplete="username"
            placeholder="Enter your username"
            sx={{
              width: "100%"
            }}
            helperText={errors.username?.message}
            error={!!errors.username}
            {...register("username", {
              required: "Username is required",
            })}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlined />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Grid>
        <Grid size={12} sx={{ mb: 1.5 }}>
          <InputLabel htmlFor="signin-password" sx={{ fontWeight: "bold", mb: 1 }}>Password</InputLabel>
          <TextField id="signin-password" variant="outlined" type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            sx={{
              width: "100%"
            }}
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            })}
            helperText={errors.password?.message}
            error={!!errors.password}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Grid>
        <Grid size={12} sx={{ mb: 4, display: "flex", justifyContent: "flex-end" }}>
          <Link underline="none" sx={{ fontFamily: "Roboto, Helvetica, Arial, sans-serif" }}>Forgot password?</Link>
        </Grid>
        <Grid size={12}>
          <Button type="submit" variant="contained" color="primary" size="medium"
            startIcon={<LoginIcon />}
            sx={{ width: "100%", padding: "12px 6px" }}
          >Sign in</Button>
        </Grid>
        <Grid size={12} sx={{ mt: 4, display: "flex", flexDirection: "column", gap: "12px" }}>
          <Divider sx={{
            fontFamily: "Roboto, Helvetica, Arial, sans-serif",
            "&::before, &::after": {
              borderTopWidth: "2px"
            },
            color: "GrayText",
            fontSize: "18px",
            mb: 2

          }}>or continue with</Divider>
          <Button variant="outlined" size="medium"
            startIcon={<Google />}
            sx={{ width: "100%", padding: "12px 6px" }}
          >Continue with Google</Button>

          <Button variant="outlined" size="medium"
            startIcon={<Apple />}
            sx={{ width: "100%", padding: "12px 6px" }}
          >Continue with Apple</Button>
        </Grid>
      </Grid>
    </form>
  );

}
export default SignInForm;