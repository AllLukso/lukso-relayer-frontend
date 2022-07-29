import react from "react";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";

function QuotaModal() {
  function handleClose() {}

  function open() {}

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>Increase Quota</DialogTitle>
    </Dialog>
  );
}

export default QuotaModal;
