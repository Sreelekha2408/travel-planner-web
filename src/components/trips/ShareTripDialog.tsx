import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText } from "@mui/material";
import ShareOutlined from "@mui/icons-material/ShareOutlined";
import { useState } from "react";
import { useNotify } from "../../context/useNotify";
import { useUpdateTrip } from "../../services/tripQueries";
import { toTripInput, type Trip } from "../../services/tripService";
import DialogIconTitle from "../common/DialogIconTitle";
import InviteEmailsField from "./InviteEmailsField";

type ShareTripDialogProps = {
  trip: Trip;
  open: boolean;
  onClose: () => void;
};

// "Share trip" from the trip page: add or remove invitees without opening the edit form.
// Saves through the normal trip update (PUT /trip/{id}) with only the invites changed.
const ShareTripDialog = ({ trip, open, onClose }: ShareTripDialogProps) => {
  const notify = useNotify();
  const updateTrip = useUpdateTrip(trip.tripId);
  const [emails, setEmails] = useState(trip.invitedEmails);

  const unchanged = emails.length === trip.invitedEmails.length && emails.every((email) => trip.invitedEmails.includes(email));

  const close = () => {
    if (updateTrip.isPending) return;
    updateTrip.reset();
    setEmails(trip.invitedEmails); // reopening starts from what's saved
    onClose();
  };

  const save = () => {
    updateTrip.mutate(
      { ...toTripInput(trip), invitedEmails: emails },
      {
        onSuccess: () => {
          notify.success("Invites updated");
          updateTrip.reset();
          onClose();
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      // Between MUI's xs (444px) and sm (600px): room for the email field and Add button.
      slotProps={{ paper: { sx: { maxWidth: 480 } } }}
      aria-labelledby="share-trip-title"
      aria-describedby="share-trip-description"
    >
      <DialogIconTitle id="share-trip-title" icon={<ShareOutlined />} tone="primary">
        Share “{trip.title}”
      </DialogIconTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <DialogContentText id="share-trip-description" sx={{ fontSize: 14, color: "text.secondary" }}>
          Invite the people you're travelling with. They'll be able to view this trip once sharing is
          live; for now invites are saved with the trip but not emailed.
        </DialogContentText>
        <Box sx={{ pt: 1 }}>
          <InviteEmailsField value={emails} onChange={setEmails} label="Email address" helperText="Press Enter or Add after each email." />
        </Box>
        {updateTrip.isError && <Alert severity="error">{updateTrip.error.message || "Couldn't save the invites. Please try again."}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button onClick={close} variant="outlined" disabled={updateTrip.isPending}>Cancel</Button>
        <Button onClick={save} variant="contained" disabled={updateTrip.isPending || unchanged}>
          {updateTrip.isPending ? "Saving…" : "Save invites"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default ShareTripDialog;
