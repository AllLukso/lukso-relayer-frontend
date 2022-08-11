import react from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import DeleteIcon from "@mui/icons-material/Delete";

const rows = [
  { id: 1, address: "0x93776992CE0b044aA042fABBc38CDf76C3e54856" },
  { id: 2, address: "0x93776992CE0b044aA042fABBc38CDf76C3e54856" },
];

function Approve(props) {
  // TODO: Pull in currently approved profiles
  // TODO: Allow new profiles to be added.

  async function setApprovalAddress(address) {}
  async function updateApprovals() {}
  return (
    <div style={{ marginTop: "30px" }}>
      <Typography gutterBottom variant="h5">
        Approve
      </Typography>
      <Typography gutterBottom variant="subtitle2">
        approve other UPs to use your quota
      </Typography>
      <TextField
        style={{ marginTop: "15px" }}
        sx={{ input: { color: "white", border: "white" } }}
        variant="outlined"
        fullWidth
        label="Address 0x..."
        size="small"
        onChange={(e) => setApprovalAddress(e.target.value)}
        type="text"
      ></TextField>
      <Button
        style={{ marginTop: "10px" }}
        variant="contained"
        onClick={updateApprovals}
      >
        Approve
      </Button>
      <Typography
        style={{ marginTop: "20px" }}
        variant="subtitle2"
        gutterBottom
      >
        Approved Addresses
      </Typography>
      <TableContainer component={Paper}>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Address</TableCell>
              <TableCell align="right">Delete</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.name}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {row.address}
                </TableCell>
                <TableCell align="right">
                  <DeleteIcon style={{ cursor: "pointer" }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default Approve;
