import "../styles/globals.css";
import NavBar from "../components/navBar";
import Grid from "@mui/material/Unstable_Grid2";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#69ADFF", contrastTest: "#F7F7F8" },
    type: "dark",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          color: "#F7F7F8",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          color: "#F7F7F8",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#F7F7F8",
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: "#303150",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          color: "#F7F7F8",
        },
      },
    },
    MuiLoadingButton: {
      styleOverrides: {
        root: {
          border: "1px solid #69ADFF"
        },
        loadingIndicator: {
          color: "#69ADFF"
        }
      }
    }
  },
});

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <Grid container>
        <Grid xs={12} sm={2}>
          <NavBar />
        </Grid>
        <Grid xs={12} sm={10}>
          <Component {...pageProps} />
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}

export default MyApp;
