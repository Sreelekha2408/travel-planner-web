import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { alpha } from "@mui/material/styles";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
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
    <Dialog
      open={trip !== null}
      onClose={close}
      maxWidth="xs"
      fullWidth
      aria-labelledby="delete-trip-title"
      aria-describedby="delete-trip-description"
    >
      <Box sx={{ px: 3, pt: 3 }}>
        <Box
          aria-hidden
          sx={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
            color: "error.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DeleteOutlined />
        </Box>
      </Box>
      <DialogTitle id="delete-trip-title" sx={{ fontSize: 18, fontWeight: 700, pt: 2, pb: 1 }}>
        Delete “{trip?.title}”?
      </DialogTitle>
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
