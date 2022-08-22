import react, { useState, useEffect } from "react";
import styles from "../styles/Home.module.css";
import axios from "axios";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Link from "@mui/material/Link";
import TablePagination from "@mui/material/TablePagination";

function Transactions({ upAddress }) {
  const [transactions, settransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    async function fetchTransactions() {
      const resp = await axios.get(
        `${process.env.NEXT_PUBLIC_RELAYER_HOST}/v1/transactions/${upAddress}`
      );
      settransactions(resp.data.transactions);
    }
    fetchTransactions();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - transactions.length) : 0;

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <Typography style={{ marginTop: "20px" }} variant="h5" gutterBottom>
          Transactions
        </Typography>
        <TableContainer component={Paper}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Hash</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Gas Used</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? transactions.slice(
                    page * rowsPerPage,
                    page * rowsPerPage + rowsPerPage
                  )
                : transactions
              ).map((row) => (
                <TableRow
                  key={row.hash}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    <Link
                      href={`https://explorer.execution.l16.lukso.network/tx/${row.hash}/internal-transactions`}
                    >
                      {row.hash}
                    </Link>
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {row.status}
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {row.gas_used}
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {new Date(row.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={transactions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </main>
    </div>
  );
}

export default Transactions;
