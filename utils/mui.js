import { createTheme } from "@mui/material/styles";

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
          border: "1px solid #69ADFF",
        },
        loadingIndicator: {
          color: "#69ADFF",
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          color: "#F7F7F8",
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          background: "none",
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          color: "#F7F7F8",
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: "#F7F7F8",
        },
      },
    },
  },
});

module.exports = { theme };
