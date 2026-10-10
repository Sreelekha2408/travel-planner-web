import { Alert, Box, Button, Checkbox, FormControlLabel, InputLabel, Link, TextField, Typography } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";
import { colors } from "../../common/theme";
import { EMAIL_PATTERN } from "../../common/tripUtils";
import { useAuth } from "../../context/useAuth";
import Logo from "../layout/Logo";
import { ApiError } from "../../services/serviceWrapper";
import { authInputSx, authLabelSx, authSubmitSx } from "./styles";

type SignInFormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
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
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({ defaultValues: { email: "", password: "", rememberMe: false } });

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
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* The brand panel (with its logo) is hidden on small screens */}
      <Box sx={{ display: { xs: "block", md: "none" } }}><Logo /></Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        <Typography component="h1" sx={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em" }}>Welcome back</Typography>
        <Typography sx={{ fontSize: 14, color: colors.textMuted }}>Sign in to pick up where you left off.</Typography>
      </Box>

      {errors.root?.serverError && <Alert severity="error">{errors.root.serverError.message}</Alert>}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box>
          <InputLabel htmlFor="signin-email" sx={authLabelSx}>Email address</InputLabel>
          <TextField
            id="signin-email"
            type="email"
            autoComplete="username"
            placeholder="you@example.com"
            fullWidth
            sx={authInputSx}
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register("email", {
              required: "Email is required",
              pattern: { value: EMAIL_PATTERN, message: "Enter a valid email address" },
            })}
          />
        </Box>
        <Box>
          {/* No length rule here: that belongs to sign-up. Older accounts may have shorter passwords. */}
          <InputLabel htmlFor="signin-password" sx={authLabelSx}>Password</InputLabel>
          <TextField
            id="signin-password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            fullWidth
            sx={authInputSx}
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register("password", { required: "Password is required" })}
          />
        </Box>
        <Controller
          name="rememberMe"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox checked={field.value} onChange={(event) => field.onChange(event.target.checked)} size="small" />}
              label="Keep me signed in on this device"
              slotProps={{ typography: { sx: { fontSize: 13, color: "#3F4553" } } }}
            />
          )}
        />
      </Box>

      <Button type="submit" variant="contained" disabled={isSubmitting} sx={authSubmitSx}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>

      <Typography sx={{ textAlign: "center", fontSize: 14, color: colors.textMuted }}>
        New to TravelPlan?{" "}
        <Link component={RouterLink} to="/signup" sx={{ fontWeight: 600 }}>Create an account</Link>
      </Typography>
    </Box>
  );
};
export default SignInForm;
