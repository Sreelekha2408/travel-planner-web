import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText } from "@mui/material";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import { useDeleteTrip } from "../../services/tripQueries";
import type { Trip } from "../../services/tripService";
import DialogIconTitle from "../common/DialogIconTitle";

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
    <Dialog
      open={trip !== null}
      onClose={close}
      maxWidth="xs"
      fullWidth
      aria-labelledby="delete-trip-title"
      aria-describedby="delete-trip-description"
    >
      <DialogIconTitle id="delete-trip-title" icon={<DeleteOutlined />} tone="error">
        Delete “{trip?.title}”?
      </DialogIconTitle>
      <DialogContent>
        <DialogContentText id="delete-trip-description" sx={{ fontSize: 14, color: "text.secondary" }}>
          The trip and its itinerary, expenses and invites will be permanently deleted. This can't be undone.
        </DialogContentText>
        {deleteTrip.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {deleteTrip.error.message || "Couldn't delete the trip. Please try again."}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button onClick={close} variant="outlined" disabled={deleteTrip.isPending}>Cancel</Button>
        <Button onClick={confirm} color="error" variant="contained" disabled={deleteTrip.isPending}>
          {deleteTrip.isPending ? "Deleting…" : "Delete trip"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default DeleteTripDialog;
