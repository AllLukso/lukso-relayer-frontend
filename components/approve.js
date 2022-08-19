import react, { useEffect, useState } from "react";
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
import axios from "axios";
import { ethers } from "ethers"

function Approve({upAddress, signer}) {
  // TODO: Allow new profiles to be added.
  const [approvals, setApprovals] = useState([]);
  const [approvalAddress, setApprovalAddress] = useState("")

  useEffect(() => {
    async function fetchApprovals() {
      const resp = await axios.get(
        `${process.env.NEXT_PUBLIC_RELAYER_HOST}/v1/approvals/${upAddress}`
      );
      setApprovals(resp?.data?.approvals);
    }
    fetchApprovals();
  }, []);

  async function updateApprovals() {

    const message = ethers.utils.solidityKeccak256(
      ["string"],
      [`I approve ${approvalAddress} to use my quota`]
    );

    const signatureObject = await signer.provider.send("eth_sign", [
      upAddress,
      message,
    ]);

    const resp = await axios.post(`${process.env.NEXT_PUBLIC_RELAYER_HOST}/v1/approvals`, { approvedAddress: approvalAddress, approverAddress: upAddress, signature: signatureObject.signature })
    setApprovals([...approvals, resp.data.approval])
  }

  async function deleteApproval(deleteAddress) {
    const message = ethers.utils.solidityKeccak256(
      ["string"],
      [`I revoke ${deleteAddress} to use my quota`]
    );

    const signatureObject = await signer.provider.send("eth_sign", [
      upAddress,
      message,
    ]);

    await axios.post(`${process.env.NEXT_PUBLIC_RELAYER_HOST}/v1/approvals/delete`, { approvedAddress: deleteAddress, approverAddress: upAddress, signature: signatureObject.signature })
    console.log("approvals: ", approvals)
    setApprovals([...(approvals.filter(a => a.approved_address !== deleteAddress))])
  }

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
            {approvals.map((row) => (
              <TableRow
                key={row.approved_address}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {row.approved_address}
                </TableCell>
                <TableCell align="right">
                  <DeleteIcon onClick={e => deleteApproval(row.approved_address)} style={{ cursor: "pointer" }} />
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
