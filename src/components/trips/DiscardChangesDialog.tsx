import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { alpha } from "@mui/material/styles";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";

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
    <Box sx={{ px: 3, pt: 3 }}>
      <Box
        aria-hidden
        sx={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
          color: "warning.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <WarningAmberRounded />
      </Box>
    </Box>
    <DialogTitle id="discard-changes-title" sx={{ fontSize: 18, fontWeight: 700, pt: 2, pb: 1 }}>
      Discard changes?
    </DialogTitle>
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
