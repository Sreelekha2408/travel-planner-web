import { Alert, Box, Button, Skeleton, Typography } from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import { useState } from "react";
import { groupItineraryByDay } from "../../common/itineraryUtils";
import { useNotify } from "../../context/useNotify";
import { useAddItineraryItem, useDeleteItineraryItem, useItinerary, useUpdateItineraryItem } from "../../services/itineraryQueries";
import type { ItineraryInput, ItineraryItem } from "../../services/itineraryService";
import type { Trip } from "../../services/tripService";
import ActivityForm from "./ActivityForm";
import ActivityRow from "./ActivityRow";

// The design's day label: small indigo capitals with a thin line running to the right.
const DayLabel = ({ children, id }: { children: string; id: string }) => (
  <Typography
    id={id}
    component="h3"
    sx={{
      fontSize: 11,
      fontWeight: 700,
      color: "primary.main",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      mb: 1.25,
      display: "flex",
      alignItems: "center",
      gap: 1,
      "&::after": { content: '""', flex: 1, height: "1px", bgcolor: "brand.soft" },
    }}
  >
    {children}
  </Typography>
);

const addLabel = (itemCount: number) => (itemCount ? "Add activity" : "Nothing planned yet. Add an activity");

// Which inline form is open: adding to a day, or editing one activity. One at a time.
type OpenForm = { mode: "add"; date: string } | { mode: "edit"; itineraryItemId: number } | null;

// A trip's plan, day by day (the trip page's Itinerary tab), with inline add/edit/delete.
const ItineraryTimeline = ({ trip }: { trip: Trip }) => {
  const { data: items, isPending, isError, error, refetch } = useItinerary(trip.tripId);
  const addItem = useAddItineraryItem(trip.tripId);
  const updateItem = useUpdateItineraryItem(trip.tripId);
  const deleteItem = useDeleteItineraryItem(trip.tripId);
  const notify = useNotify();
  const [openForm, setOpenForm] = useState<OpenForm>(null);

  // Opening a form clears the previous form's error state.
  const open = (form: OpenForm) => {
    addItem.reset();
    updateItem.reset();
    deleteItem.reset();
    setOpenForm(form);
  };
  const close = () => open(null);

  const add = (input: ItineraryInput) =>
    addItem.mutate(input, {
      onSuccess: () => {
        notify.success(`“${input.title}” added`);
        close();
      },
    });
  const save = (item: ItineraryItem, input: ItineraryInput) =>
    updateItem.mutate(
      { itineraryItemId: item.itineraryItemId, input },
      {
        onSuccess: () => {
          notify.success(`“${input.title}” saved`);
          close();
        },
      },
    );
  // No confirmation dialog: deleting is only reachable from inside the edit form, so it
  // already takes a deliberate second step.
  const remove = (item: ItineraryItem) =>
    deleteItem.mutate(item.itineraryItemId, {
      onSuccess: () => {
        notify.success(`“${item.title}” removed`);
        close();
      },
    });

  if (isPending) {
    return (
      <Box aria-busy="true" aria-label="Loading itinerary" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Skeleton variant="text" width={180} />
        <Skeleton variant="rounded" height={60} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={60} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }
  if (isError) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}>
        Couldn't load the itinerary. {error.message}
      </Alert>
    );
  }

  const renderItem = (item: ItineraryItem, showDate = false) =>
    openForm?.mode === "edit" && openForm.itineraryItemId === item.itineraryItemId ? (
      <ActivityForm
        key={item.itineraryItemId}
        item={item}
        date={item.activityDate}
        trip={trip}
        saving={updateItem.isPending}
        deleting={deleteItem.isPending}
        error={(updateItem.error ?? deleteItem.error)?.message ?? null}
        onSave={(input) => save(item, input)}
        onCancel={close}
        onDelete={() => remove(item)}
      />
    ) : (
      <ActivityRow
        key={item.itineraryItemId}
        item={item}
        currency={trip.currency}
        showDate={showDate}
        onEdit={() => open({ mode: "edit", itineraryItemId: item.itineraryItemId })}
      />
    );

  const { days, outsideTrip } = groupItineraryByDay(items, trip);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {days.map((day) => (
        <Box component="section" key={day.date} aria-labelledby={`day-${day.date}`}>
          <DayLabel id={`day-${day.date}`}>{day.label}</DayLabel>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {day.items.map((item) => renderItem(item))}
            {openForm?.mode === "add" && openForm.date === day.date ? (
              <ActivityForm
                date={day.date}
                trip={trip}
                saving={addItem.isPending}
                error={addItem.error?.message ?? null}
                onSave={add}
                onCancel={close}
              />
            ) : (
              <Button
                startIcon={<AddRounded />}
                onClick={() => open({ mode: "add", date: day.date })}
                // The visible text plus which day, so screen readers can tell the buttons apart
                aria-label={`${addLabel(day.items.length)}: ${day.label}`}
                sx={{ alignSelf: "flex-start", fontSize: 13, color: day.items.length ? "text.secondary" : "primary.main" }}
              >
                {addLabel(day.items.length)}
              </Button>
            )}
          </Box>
        </Box>
      ))}
      {outsideTrip.length > 0 && (
        <Box component="section" aria-labelledby="day-outside">
          <DayLabel id="day-outside">Outside the trip dates</DayLabel>
          <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 1, px: 0.5 }}>
            These were planned for days that are no longer part of the trip. Edit one to move it to a trip day.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>{outsideTrip.map((item) => renderItem(item, true))}</Box>
        </Box>
      )}
    </Box>
  );
};
export default ItineraryTimeline;
