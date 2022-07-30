import react, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

function QuotaModal(props) {
  const { onClose, open, onSubmit } = props;
  const [increaseQuota, setIncreaseQuota] = useState(0);

  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>Increase Quota</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Please enter the amount you would like to increase your quota by.
        </DialogContentText>
        <TextField
          onChange={(e) => setIncreaseQuota(e.target.value)}
          margin="dense"
          fullWidth
          size="small"
          label="Increase Amount"
          variant="standard"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSubmit(increaseQuota)}>Increase Quota</Button>
      </DialogActions>
    </Dialog>
  );
}

export default QuotaModal;
