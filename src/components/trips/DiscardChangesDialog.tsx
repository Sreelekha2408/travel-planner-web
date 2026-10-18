import { Button, Dialog, DialogActions, DialogContent, DialogContentText } from "@mui/material";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import DialogIconTitle from "../common/DialogIconTitle";

type DiscardChangesDialogProps = {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
};

// Asked when leaving a form that has unsaved changes.
const DiscardChangesDialog = ({ open, onKeepEditing, onDiscard }: DiscardChangesDialogProps) => (
  <Dialog
    open={open}
    onClose={onKeepEditing} // Escape or clicking outside keeps you on the form
    maxWidth="xs"
    fullWidth
    aria-labelledby="discard-changes-title"
    aria-describedby="discard-changes-description"
  >
    <DialogIconTitle id="discard-changes-title" icon={<WarningAmberRounded />} tone="warning">
      Discard changes?
    </DialogIconTitle>
    <DialogContent>
      <DialogContentText id="discard-changes-description" sx={{ fontSize: 14, color: "text.secondary" }}>
        You have unsaved changes. If you leave now, they'll be lost.
      </DialogContentText>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
      {/* The safe choice is the default focus */}
      <Button onClick={onKeepEditing} variant="outlined" autoFocus>Keep editing</Button>
      <Button onClick={onDiscard} variant="contained" color="error">Discard changes</Button>
    </DialogActions>
  </Dialog>
);
export default DiscardChangesDialog;
