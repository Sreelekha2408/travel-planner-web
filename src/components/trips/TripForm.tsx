import { Alert, Box, Button, Chip, FormControl, FormLabel, InputAdornment, MenuItem, TextField, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import { useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";
import { gradients } from "../../common/theme";
import {
  DEFAULT_CURRENCY,
  formatBudget,
  formatDateRange,
  formatTravellers,
  tripLengthInDays,
  tripTypeLabel,
  tripTypeOptions,
} from "../../common/tripUtils";
import { ApiError } from "../../services/serviceWrapper";
import type { Trip, TripInput, TripType } from "../../services/tripService";
import { useNotify } from "../../context/useNotify";
import CurrencyPicker from "./CurrencyPicker";
import InviteEmailsField from "./InviteEmailsField";

// Form state differs from the API shape: pickers hold Dayjs objects and inputs hold strings.
// toTripInput() converts on submit.
type TripFormValues = {
  title: string;
  source: string;
  destination: string;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  budget: string;
  currency: string;
  travellers: string; // "1".."5" from the select
  tripTypes: TripType[];
  invitedEmails: string[];
};

function toFormValues(trip?: Trip): TripFormValues {
  return {
    title: trip?.title ?? "",
    source: trip?.source ?? "",
    destination: trip?.destination ?? "",
    startDate: trip ? dayjs(trip.startDate) : null,
    endDate: trip ? dayjs(trip.endDate) : null,
    budget: trip?.budget != null ? String(trip.budget) : "",
    currency: trip?.currency ?? DEFAULT_CURRENCY,
    travellers: trip?.travellers != null ? String(Math.min(trip.travellers, 5)) : "1",
    tripTypes: trip?.tripTypes ?? [],
    invitedEmails: trip?.invitedEmails ?? [],
  };
}

function toTripInput(values: TripFormValues): TripInput {
  return {
    title: values.title.trim(),
    source: values.source.trim() || null,
    destination: values.destination.trim(),
    // Validation guarantees both dates are set; LocalDate expects yyyy-MM-dd.
    startDate: values.startDate!.format("YYYY-MM-DD"),
    endDate: values.endDate!.format("YYYY-MM-DD"),
    budget: values.budget === "" ? null : Number(values.budget),
    currency: values.currency,
    travellers: Number(values.travellers),
    tripTypes: values.tripTypes,
    invitedEmails: values.invitedEmails,
  };
}

function getSaveErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Can't reach the server. Check your connection and try again.";
  if (error.status >= 500) return "Something went wrong on our side. Please try again.";
  return error.message; // e.g. the backend's 400 "End date must be on or after the start date"
}

// One line of the summary card: an emoji, a muted label and the value in white.
// Rendered as <dt>/<dd> inside a <dl>, the semantic element for label–value pairs.
// The emoji is decorative (aria-hidden): the label already says what the row is.
const SummaryRow = ({ emoji, label, value }: { emoji: string; label: string; value: string }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
    <Box component="span" aria-hidden sx={{ fontSize: 18, lineHeight: 1, width: 22, textAlign: "center", flexShrink: 0 }}>
      {emoji}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography component="dt" sx={{ fontSize: 11, fontWeight: 600, color: "brand.onDark" }}>{label}</Typography>
      <Typography component="dd" sx={{ m: 0, fontSize: 14, fontWeight: 600, color: "common.white" }}>{value}</Typography>
    </Box>
  </Box>
);

type TripFormProps = {
  trip?: Trip; // present = edit mode
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (input: TripInput) => Promise<unknown>;
};

const TripForm = ({ trip, submitLabel, submittingLabel, onSubmit }: TripFormProps) => {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TripFormValues>({ defaultValues: toFormValues(trip) });

  // Drives the live "Trip summary" card.
  const [title, destination, startDate, endDate, budget, currency, travellers, tripTypes] = useWatch({
    control,
    name: ["title", "destination", "startDate", "endDate", "budget", "currency", "travellers", "tripTypes"],
  });
  const summaryDates =
    startDate?.isValid() && endDate?.isValid() && !endDate.isBefore(startDate, "day")
      ? `${formatDateRange(startDate.format("YYYY-MM-DD"), endDate.format("YYYY-MM-DD"))} · ${tripLengthInDays(
          startDate.format("YYYY-MM-DD"),
          endDate.format("YYYY-MM-DD"),
        )} days`
      : null;

  // register() returns a ref that, on a MUI TextField, lands on the wrapper; react-hook-form
  // then binds to the first <input> inside it. The budget field has the currency Select's
  // hidden input first, so its ref goes straight to the real input via inputRef instead.
  const notify = useNotify();
  const budgetFieldRef = useRef<HTMLDivElement>(null); // anchor for the currency menu
  const { ref: budgetRef, ...budgetField } = register("budget", {
    validate: (value) => value === "" || Number(value) >= 0 || "Budget can't be negative",
  });

  const submit = async (values: TripFormValues) => {
    try {
      await onSubmit(toTripInput(values));
    } catch (error) {
      const message = getSaveErrorMessage(error);
      // Inline alert (stays visible) + toast (the alert can be scrolled out of view).
      setError("root.serverError", { message });
      notify.error(message);
    }
  };

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, alignItems: "flex-start" }}>
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(submit)}
        sx={{ flex: "2 1 460px", minWidth: 0, bgcolor: "background.paper", borderRadius: 4, p: { xs: 2.5, sm: 3.5 }, boxShadow: 1, display: "flex", flexDirection: "column", gap: 2.5 }}
      >
        {errors.root?.serverError && <Alert severity="error">{errors.root.serverError.message}</Alert>}

        <TextField
          id="trip-title"
          label="Trip name"
          placeholder="e.g. Bali Escape"
          required
          fullWidth
          error={!!errors.title}
          helperText={errors.title?.message}
          {...register("title", {
            validate: (value) => value.trim() !== "" || "Trip name is required",
            maxLength: { value: 100, message: "Keep it under 100 characters" },
          })}
        />

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <TextField
            id="trip-source"
            label="From"
            placeholder="Where you're leaving from"
            sx={{ flex: "1 1 180px" }}
            {...register("source")}
          />
          <TextField
            id="trip-destination"
            label="Destination"
            placeholder="City or country"
            required
            sx={{ flex: "1 1 180px" }}
            error={!!errors.destination}
            helperText={errors.destination?.message}
            {...register("destination", {
              validate: (value) => value.trim() !== "" || "Destination is required",
            })}
          />
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {/* Pickers are controlled components, so they use <Controller> instead of register(). */}
          <Controller
            name="startDate"
            control={control}
            rules={{
              validate: (value) => (value?.isValid() ?? false) || "Start date is required",
              deps: ["endDate"], // re-check the end date whenever the start date changes
            }}
            render={({ field, fieldState }) => (
              <DatePicker
                label="Start date"
                value={field.value}
                onChange={field.onChange}
                inputRef={field.ref}
                sx={{ flex: "1 1 180px" }}
                slotProps={{
                  textField: {
                    id: "trip-start-date",
                    required: true,
                    onBlur: field.onBlur,
                    error: !!fieldState.error,
                    helperText: fieldState.error?.message,
                  },
                }}
              />
            )}
          />
          <Controller
            name="endDate"
            control={control}
            rules={{
              validate: (value, values) => {
                if (!value?.isValid()) return "End date is required";
                if (values.startDate?.isValid() && value.isBefore(values.startDate, "day")) {
                  return "End date must be on or after the start date";
                }
                return true;
              },
            }}
            render={({ field, fieldState }) => (
              <DatePicker
                label="End date"
                value={field.value}
                onChange={field.onChange}
                inputRef={field.ref}
                minDate={startDate?.isValid() ? startDate : undefined} // greys out earlier days
                sx={{ flex: "1 1 180px" }}
                slotProps={{
                  textField: {
                    id: "trip-end-date",
                    required: true,
                    onBlur: field.onBlur,
                    error: !!fieldState.error,
                    helperText: fieldState.error?.message,
                  },
                }}
              />
            )}
          />
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {/* MUI's select is a controlled component, so it also goes through <Controller>. */}
          <Controller
            name="travellers"
            control={control}
            render={({ field }) => (
              <TextField
                select
                id="trip-travellers"
                label="Travellers"
                sx={{ flex: "1 1 180px" }}
                {...field}
              >
                <MenuItem value="1">Just me</MenuItem>
                <MenuItem value="2">2 travellers</MenuItem>
                <MenuItem value="3">3 travellers</MenuItem>
                <MenuItem value="4">4 travellers</MenuItem>
                <MenuItem value="5">5 or more</MenuItem>
              </TextField>
            )}
          />
          <TextField
            id="trip-budget"
            label="Total budget"
            type="number"
            placeholder="3000"
            sx={{ flex: "1 1 180px" }}
            error={!!errors.budget}
            helperText={errors.budget?.message}
            slotProps={{
              input: {
                // Currency picker inside the field, in place of a fixed "$".
                startAdornment: (
                  <InputAdornment position="start">
                    <Controller
                      name="currency"
                      control={control}
                      render={({ field }) => (
                        <CurrencyPicker value={field.value} onChange={field.onChange} anchorRef={budgetFieldRef} />
                      )}
                    />
                  </InputAdornment>
                ),
              },
              htmlInput: { min: 0, step: 1, inputMode: "decimal" },
            }}
            {...budgetField}
            ref={budgetFieldRef}
            inputRef={budgetRef}
          />
        </Box>

        <Controller
          name="tripTypes"
          control={control}
          render={({ field }) => (
            // fieldset + legend groups the chips under one label for screen readers.
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontSize: 13, fontWeight: 600, color: "text.primary", mb: 1.25 }}>
                What kind of trip is it?
              </FormLabel>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {tripTypeOptions.map((option) => {
                  const selected = field.value.includes(option.value);
                  return (
                    <Chip
                      key={option.value}
                      label={option.label}
                      clickable
                      color={selected ? "primary" : "default"}
                      variant={selected ? "filled" : "outlined"}
                      aria-pressed={selected} // announced as a toggle button
                      onClick={() =>
                        field.onChange(
                          selected ? field.value.filter((type) => type !== option.value) : [...field.value, option.value],
                        )
                      }
                    />
                  );
                })}
              </Box>
            </FormControl>
          )}
        />

        <Controller
          name="invitedEmails"
          control={control}
          render={({ field }) => <InviteEmailsField value={field.value} onChange={field.onChange} />}
        />

        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 1.5, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Button component={RouterLink} to="/trips" variant="outlined" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
        </Box>
      </Box>

      <Box component="aside" sx={{ flex: "1 1 260px", minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          aria-live="polite"
          sx={{ background: gradients.tripSummary, borderRadius: 4, p: 2.75, color: "common.white", display: "flex", flexDirection: "column", gap: 1.25 }}
        >
          <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "brand.onDark" }}>
            Trip summary
          </Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 800 }}>{title.trim() || "Your trip will appear here"}</Typography>
          {destination.trim() === "" && !summaryDates ? (
            <Typography sx={{ fontSize: 13, lineHeight: 1.6, color: "brand.onDark" }}>
              Add a name, destination and dates and this card fills in as you go.
            </Typography>
          ) : null}
          <Box component="dl" sx={{ m: 0, display: "flex", flexDirection: "column", gap: 1.25 }}>
            {destination.trim() && <SummaryRow emoji="📍" label="Destination" value={destination.trim()} />}
            {summaryDates && <SummaryRow emoji="📅" label="Dates" value={summaryDates} />}
            {budget !== "" && Number(budget) >= 0 && (
              <SummaryRow emoji="💰" label="Budget" value={formatBudget(Number(budget), currency)} />
            )}
            <SummaryRow emoji="👥" label="Travellers" value={formatTravellers(Number(travellers)) ?? ""} />
            {tripTypes.length > 0 && (
              <SummaryRow emoji="🏷️" label="Trip type" value={tripTypes.map(tripTypeLabel).join(" · ")} />
            )}
          </Box>
        </Box>

        <Box sx={{ bgcolor: "background.paper", borderRadius: 4, p: 2.75, boxShadow: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Planning tips</Typography>
          {[
            "Set a budget early. The tracker will show how much is left as you add bookings.",
            "Dates can change later. Your itinerary will shift with them.",
            "Pick a few trip styles to get activity ideas that fit.",
          ].map((tip) => (
            <Box key={tip} sx={{ display: "flex", gap: 1.25 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "primary.main", mt: 0.9, flexShrink: 0 }} />
              <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: "brand.body" }}>{tip}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
export default TripForm;
