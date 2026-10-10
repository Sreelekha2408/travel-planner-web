import { MailOutlined } from "@mui/icons-material";
import { Alert, Button, Grid, InputAdornment, InputLabel, Typography } from "@mui/material";
import TextField from "@mui/material/TextField";
import { useForm } from "react-hook-form";
import LoginIcon from '@mui/icons-material/Login';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from "../../context/useAuth";
import { ApiError } from "../../services/serviceWrapper";

type SignInFormValues = {
  email: string;
  password: string;
};

function getSignInErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Can't reach the server. Check your connection and try again.";
  if (error.status === 401) return "Invalid email or password.";
  // Missing or stale CSRF token (e.g. cookies were cleared); a reload gets a fresh one.
  if (error.status === 403) return "Your session has expired. Refresh the page and try again.";
  if (error.status >= 500) return "Something went wrong on our side. Please try again.";
  return error.message;
}

const SignInForm = () => {
  const { signIn } = useAuth();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<SignInFormValues>();

  // isSubmitting stays true while this promise is pending. On success the auth status
  // changes and the SignIn page redirects, so there is no navigate() call here.
  const onSubmit = async (values: SignInFormValues) => {
    try {
      await signIn(values);
    } catch (error) {
      setError("root.serverError", { message: getSignInErrorMessage(error) });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}
      noValidate
      style={{
        width: "100%"
      }}
    >
      <Grid container>
        <Grid size={12} sx={{ mb: 8 }}>
          <Typography component="h1" sx={{ fontSize: 42, fontWeight: "bold" }}>Welcome back!</Typography>
          <Typography sx={{ fontSize: 18 }}>Sign in to continue your journey</Typography>
        </Grid>
        {errors.root?.serverError && (
          <Grid size={12} sx={{ mb: 3 }}>
            <Alert severity="error">{errors.root.serverError.message}</Alert>
          </Grid>
        )}
        <Grid size={12} sx={{ mb: 4 }}>
          <InputLabel htmlFor="signin-email" sx={{ fontWeight: "bold", mb: 1 }}>Email address</InputLabel>
          <TextField id="signin-email" variant="outlined" type="email"
            autoComplete="username"
            placeholder="Enter your email"
            sx={{
              width: "100%"
            }}
            helperText={errors.email?.message}
            error={!!errors.email}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                message: "Enter a valid email address",
              },
            })}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlined />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Grid>
        <Grid size={12} sx={{ mb: 4 }}>
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
        <Grid size={12}>
          <Button type="submit" variant="contained" color="primary" size="medium"
            startIcon={<LoginIcon />}
            disabled={isSubmitting}
            sx={{ width: "100%", padding: "12px 6px" }}
          >{isSubmitting ? "Signing in…" : "Sign in"}</Button>
        </Grid>
      </Grid>
    </form>
  );

}
export default SignInForm;