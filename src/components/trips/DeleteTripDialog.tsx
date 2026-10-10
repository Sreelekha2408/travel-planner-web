import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { useDeleteTrip } from "../../services/tripQueries";
import type { Trip } from "../../services/tripService";

type DeleteTripDialogProps = {
  trip: Trip | null; // null = closed
  onClose: () => void;
  onDeleted: (trip: Trip) => void;
};

const DeleteTripDialog = ({ trip, onClose, onDeleted }: DeleteTripDialogProps) => {
  const deleteTrip = useDeleteTrip();

  const close = () => {
    if (deleteTrip.isPending) return; // don't hide the dialog mid-request
    deleteTrip.reset(); // clear a previous error before the next open
    onClose();
  };

  const confirm = () => {
    if (!trip) return;
    deleteTrip.mutate(trip.tripId, {
      onSuccess: () => {
        deleteTrip.reset();
        onDeleted(trip);
      },
    });
  };

  return (
    <Dialog open={trip !== null} onClose={close} aria-labelledby="delete-trip-title">
      <DialogTitle id="delete-trip-title">Delete “{trip?.title}”?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This also deletes the trip's itinerary and expenses. This can't be undone.
        </DialogContentText>
        {deleteTrip.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {deleteTrip.error.message || "Couldn't delete the trip. Please try again."}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={close} disabled={deleteTrip.isPending}>Cancel</Button>
        <Button onClick={confirm} color="error" variant="contained" disabled={deleteTrip.isPending}>
          {deleteTrip.isPending ? "Deleting…" : "Delete trip"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default DeleteTripDialog;
