import react, {useState, useEffect} from "react";
import styles from "../styles/Home.module.css";
import axios from "axios"
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

function Transactions({upAddress}) {
  const [transactions, settransactions] = useState([])

  useEffect(() => {
    async function fetchTransactions() {
      const resp = await axios.get(`${process.env.NEXT_PUBLIC_RELAYER_HOST}/v1/transactions/${upAddress}`)
      settransactions(resp.data.transactions)
    }
    fetchTransactions()
  }, [])

  return (
    <div className={styles.container}>
      <main className={styles.main}>
      <Typography
        style={{ marginTop: "20px" }}
        variant="subtitle2"
        gutterBottom
      >
        Transactions
      </Typography>
      <TableContainer component={Paper}>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Hash</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Gas Used</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((row) => (
              <TableRow
                key={row.hash}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {row.hash}
                </TableCell>
                <TableCell component="th" scope="row">
                  {row.status}
                </TableCell>
                <TableCell component="th" scope="row">
                  {row.gas_used}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      </main>
    </div>
  );
}

export default Transactions;
