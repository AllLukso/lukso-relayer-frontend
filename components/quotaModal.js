import react, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";


function QuotaModal(props) {
  const { onClose, open, onSubmit } = props;
  const [selectedPlan, setSelectedPlan] = useState("");

  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>Increase Quota</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Select a monthly quota plan
        </DialogContentText>
        <Select
          value={selectedPlan}
          label="Monthly Subscription"
          onChange={e => setSelectedPlan(e.target.value)}
        >
          <MenuItem value={"basic"}>Basic</MenuItem>
          <MenuItem value={"premium"}>Premium</MenuItem>
        </Select>
      </DialogContent>

      <DialogActions>
        <Button variant="contained" size="small" onClick={onClose}>Cancel</Button>
        <Button variant="contained" size="small" onClick={() => onSubmit(selectedPlan)}>Increase Quota</Button>
      </DialogActions>
    </Dialog>
  );
}

export default QuotaModal;
