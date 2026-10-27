import { Alert, Box, Button, Checkbox, FormControlLabel, FormHelperText, InputLabel, Link, TextField, Typography } from "@mui/material";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";
import { getPasswordStrength, meetsPasswordRule } from "../../common/passwordStrength";
import { EMAIL_PATTERN } from "../../common/tripUtils";
import { useAuth } from "../../context/useAuth";
import { signUp } from "../../services/authenticationService";
import { ApiError } from "../../services/serviceWrapper";
import PasswordField from "../common/PasswordField";
import Logo from "../layout/Logo";
import { authInputSx, authLabelSx, authSubmitSx } from "../signin/styles";

type SignUpFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  acceptTerms: boolean;
};

// Bar colour per strength score (0-4), as theme palette paths.
const meterColors = ["brand.meterTrack", "brand.meterWeak", "brand.meterWeak", "brand.meterFair", "success.main"];

function getSignUpErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Can't reach the server. Check your connection and try again.";
  if (error.status === 403) return "Your session has expired. Refresh the page and try again.";
  if (error.status >= 500) return "Something went wrong on our side. Please try again.";
  return error.message; // e.g. 409 "An account with this email already exists"
}

const SignUpForm = () => {
  const { signIn } = useAuth();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    defaultValues: { firstName: "", lastName: "", email: "", password: "", acceptTerms: false },
  });
  const password = useWatch({ control, name: "password" });
  const strength = getPasswordStrength(password);

  // Create the account, then sign in with the same credentials. The page redirects
  // once the auth status becomes "authenticated".
  const onSubmit = async ({ firstName, lastName, email, password }: SignUpFormValues) => {
    try {
      await signUp({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password });
      await signIn({ email: email.trim(), password });
    } catch (error) {
      setError("root.serverError", { message: getSignUpErrorMessage(error) });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 2.75 }}>
      <Logo />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        <Typography component="h1" sx={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em" }}>Create your account</Typography>
        <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
          Free to start. Your first trip takes about two minutes to set up.
        </Typography>
      </Box>

      {errors.root?.serverError && <Alert severity="error">{errors.root.serverError.message}</Alert>}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.75 }}>
          <Box sx={{ flex: "1 1 160px" }}>
            <InputLabel htmlFor="signup-first-name" sx={authLabelSx}>First name</InputLabel>
            <TextField
              id="signup-first-name"
              autoComplete="given-name"
              placeholder="First name"
              fullWidth
              sx={authInputSx}
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
              {...register("firstName", { validate: (value) => value.trim() !== "" || "First name is required" })}
            />
          </Box>
          <Box sx={{ flex: "1 1 160px" }}>
            <InputLabel htmlFor="signup-last-name" sx={authLabelSx}>Last name</InputLabel>
            <TextField
              id="signup-last-name"
              autoComplete="family-name"
              placeholder="Last name"
              fullWidth
              sx={authInputSx}
              {...register("lastName")}
            />
          </Box>
        </Box>

        <Box>
          <InputLabel htmlFor="signup-email" sx={authLabelSx}>Email address</InputLabel>
          <TextField
            id="signup-email"
            type="email"
            autoComplete="email"
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
          <InputLabel htmlFor="signup-password" sx={authLabelSx}>Password</InputLabel>
          <PasswordField
            id="signup-password"
            autoComplete="new-password" // tells password managers to suggest a new strong password
            placeholder="At least 8 characters"
            fullWidth
            sx={authInputSx}
            error={!!errors.password}
            slotProps={{ htmlInput: { "aria-describedby": "signup-password-hint" } }}
            {...register("password", {
              validate: (value) => meetsPasswordRule(value) || "Use 8 or more characters with a mix of letters and numbers",
            })}
          />
          <Box sx={{ display: "flex", gap: 0.75, mt: 1 }} aria-hidden>
            {[1, 2, 3, 4].map((bar) => (
              <Box key={bar} sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: strength.score >= bar ? meterColors[strength.score] : meterColors[0] }} />
            ))}
          </Box>
          <FormHelperText id="signup-password-hint" error={!!errors.password} aria-live="polite" sx={{ mx: 0 }}>
            {errors.password?.message ??
              (strength.label ? `Strength: ${strength.label}` : "Use 8 or more characters with a mix of letters and numbers.")}
          </FormHelperText>
        </Box>

        <Controller
          name="acceptTerms"
          control={control}
          rules={{ validate: (value) => value || "Please accept the terms to continue" }}
          render={({ field, fieldState }) => (
            <Box>
              <FormControlLabel
                control={<Checkbox checked={field.value} onChange={(event) => field.onChange(event.target.checked)} size="small" />}
                // Plain text for now: the Terms and Privacy pages don't exist yet.
                label="I agree to the Terms of Service and Privacy Policy."
                slotProps={{ typography: { sx: { fontSize: 13, color: "brand.body" } } }}
              />
              {fieldState.error && <FormHelperText error sx={{ mx: 0, mt: 0 }}>{fieldState.error.message}</FormHelperText>}
            </Box>
          )}
        />
      </Box>

      <Button type="submit" variant="contained" disabled={isSubmitting} sx={authSubmitSx}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>

      <Typography sx={{ textAlign: "center", fontSize: 14, color: "text.secondary" }}>
        Already have an account?{" "}
        <Link component={RouterLink} to="/signin" sx={{ fontWeight: 600 }}>Sign in</Link>
      </Typography>
    </Box>
  );
};
export default SignUpForm;
