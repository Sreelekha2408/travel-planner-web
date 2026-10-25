import { Alert, Box, Button, InputAdornment, MenuItem, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs, { type Dayjs } from "dayjs";
import { Controller, useForm } from "react-hook-form";
import { activityTypeOptions } from "../../common/itineraryUtils";
import { currencySymbol, DEFAULT_CURRENCY } from "../../common/tripUtils";
import type { ActivityType, ItineraryInput, ItineraryItem } from "../../services/itineraryService";

// Form state: pickers hold Dayjs objects and inputs hold strings (like TripForm).
type ActivityFormValues = {
  title: string;
  activityType: ActivityType;
  activityDate: Dayjs | null;
  activityTime: Dayjs | null;
  location: string;
  price: string;
  description: string;
};

function toFormValues(item: ItineraryItem | undefined, date: string): ActivityFormValues {
  return {
    title: item?.title ?? "",
    activityType: item?.activityType ?? "ACTIVITY",
    activityDate: dayjs(item?.activityDate ?? date),
    activityTime: item?.activityTime ? dayjs(`${item.activityDate}T${item.activityTime}`) : null,
    location: item?.location ?? "",
    price: item && item.price > 0 ? String(item.price) : "",
    description: item?.description ?? "",
  };
}

function toInput(values: ActivityFormValues): ItineraryInput {
  return {
    title: values.title.trim(),
    activityType: values.activityType,
    activityDate: values.activityDate!.format("YYYY-MM-DD"), // required by validation
    activityTime: values.activityTime?.isValid() ? values.activityTime.format("HH:mm") : null,
    location: values.location.trim() || null,
    price: values.price === "" ? 0 : Number(values.price),
    description: values.description.trim() || null,
  };
}

type ActivityFormProps = {
  item?: ItineraryItem; // present = editing
  date: string; // the day it's added to (yyyy-MM-dd)
  trip: { startDate: string; endDate: string; currency: string | null };
  saving: boolean;
  deleting?: boolean;
  error: string | null;
  onSave: (input: ItineraryInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
};

// Inline add/edit form shown inside a day of the Itinerary tab.
const ActivityForm = ({ item, date, trip, saving, deleting = false, error, onSave, onCancel, onDelete }: ActivityFormProps) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivityFormValues>({ defaultValues: toFormValues(item, date) });
  const busy = saving || deleting;
  const idPrefix = item ? `activity-${item.itineraryItemId}` : `activity-new-${date}`;

  return (
    <Box
      component="form"
      noValidate
      aria-label={item ? `Edit ${item.title}` : "Add activity"}
      onSubmit={handleSubmit((values) => onSave(toInput(values)))}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !busy) onCancel();
      }}
      sx={{ bgcolor: "background.paper", borderRadius: 3, p: 2, boxShadow: 1, border: 1, borderColor: "brand.soft", display: "flex", flexDirection: "column", gap: 1.75 }}
    >
      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <TextField
          id={`${idPrefix}-title`}
          label="What's planned?"
          placeholder="e.g. Dinner at Locavore"
          required
          autoFocus
          sx={{ flex: "2 1 220px" }}
          error={!!errors.title}
          helperText={errors.title?.message}
          {...register("title", {
            validate: (value) => value.trim() !== "" || "Add a title",
            maxLength: { value: 255, message: "Keep it under 255 characters" },
          })}
        />
        <Controller
          name="activityType"
          control={control}
          render={({ field }) => (
            <TextField select id={`${idPrefix}-type`} label="Type" sx={{ flex: "1 1 150px" }} {...field}>
              {activityTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.emoji} {option.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <Controller
          name="activityDate"
          control={control}
          rules={{ validate: (value) => (value?.isValid() ?? false) || "Pick a date" }}
          render={({ field, fieldState }) => (
            <DatePicker
              label="Date"
              value={field.value}
              onChange={field.onChange}
              inputRef={field.ref}
              // Days of the trip only; moving an activity to another day happens here too.
              minDate={dayjs(trip.startDate)}
              maxDate={dayjs(trip.endDate)}
              sx={{ flex: "1 1 160px" }}
              slotProps={{ textField: { id: `${idPrefix}-date`, required: true, error: !!fieldState.error, helperText: fieldState.error?.message } }}
            />
          )}
        />
        <Controller
          name="activityTime"
          control={control}
          render={({ field }) => (
            <TimePicker
              label="Time (optional)"
              value={field.value}
              onChange={field.onChange}
              inputRef={field.ref}
              ampm={false} // 24-hour, like the timeline ("08:45")
              sx={{ flex: "1 1 140px" }}
              slotProps={{ textField: { id: `${idPrefix}-time` } }}
            />
          )}
        />
        <TextField
          id={`${idPrefix}-price`}
          label="Cost (optional)"
          type="number"
          placeholder="0"
          sx={{ flex: "1 1 120px" }}
          error={!!errors.price}
          helperText={errors.price?.message}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start">{currencySymbol(trip.currency ?? DEFAULT_CURRENCY)}</InputAdornment> },
            htmlInput: { min: 0, step: "any" },
          }}
          {...register("price", { validate: (value) => value === "" || Number(value) >= 0 || "Can't be negative" })}
        />
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <TextField
          id={`${idPrefix}-location`}
          label="Location (optional)"
          placeholder="e.g. Ubud"
          sx={{ flex: "1 1 180px" }}
          {...register("location", { maxLength: { value: 255, message: "Keep it under 255 characters" } })}
          error={!!errors.location}
          helperText={errors.location?.message}
        />
        <TextField
          id={`${idPrefix}-notes`}
          label="Notes (optional)"
          placeholder="e.g. Reservation confirmed"
          sx={{ flex: "2 1 220px" }}
          {...register("description", { maxLength: { value: 255, message: "Keep it under 255 characters" } })}
          error={!!errors.description}
          helperText={errors.description?.message}
        />
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
        {onDelete && (
          <Button color="error" onClick={onDelete} disabled={busy} sx={{ mr: "auto" }}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        )}
        <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
          <Button variant="outlined" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={busy}>
            {saving ? "Saving…" : item ? "Save" : "Add"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
export default ActivityForm;
