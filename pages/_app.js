import "../styles/globals.css";
import NavBar from "../components/navBar";
import Grid from "@mui/material/Unstable_Grid2";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Button from "@mui/material/Button";
import { useState, useEffect } from "react"
import detectEthereumProvider from "@metamask/detect-provider";
import styles from "../styles/Home.module.css";
import { ToastContainer, toast } from "react-toastify";
import { ethers } from "ethers"
import { ERC725 } from "@erc725/erc725.js";
import LSP6Schema from "@erc725/erc725.js/schemas/LSP6KeyManager.json";

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

const notifySuccess = (message) =>
    toast.success(message, {
      closeOnClick: false,
      draggable: false,
    });

const notifyFailure = (message) =>
  toast.error(message, {
    closeOnClick: false,
    draggable: false,
  });

function MyApp({ Component, pageProps }) {
  const [signer, setSigner] = useState()
  const [upAddress, setUpAddress] = useState("")
  const [extensionAddress, setExtensionAddress] = useState("")
  const [disableConnectBtn, setDisableConnectBtn] = useState(true)

  useEffect(() => {
    async function getAccounts() {
      try {
        const provider = await getProvider();
        if (!provider) return;
        const ethersProvider = new ethers.providers.Web3Provider(provider);
        const accounts = await ethersProvider.send("eth_accounts", []);
        if (accounts.length === 0) {
          setDisableConnectBtn(false);
          return;
        }
        await initializeApp(ethersProvider, accounts[0]);
      } catch (err) {
        notifyFailure(err);
      }
    }
    getAccounts();
  }, []);

  async function initializeApp(ethersProvider, account) {
    const s = ethersProvider.getSigner();
    const chainId = await s.getChainId();
    if (chainId !== 2828) throw "Please connect to the L16 testnet";

    const erc725 = new ERC725(LSP6Schema, account, ethersProvider.provider);
    const result = await erc725.getData("AddressPermissions[]");
    // Assume the first one is the UP browser extension.
    const browserExtensionAddress = result.value[0];

    setExtensionAddress(browserExtensionAddress);
    setUpAddress(account);
    setSigner(s);
  }

  async function connectUP() {
    try {
      const provider = await getProvider();
      const p = new ethers.providers.Web3Provider(provider);
      const accounts = await p.send("eth_requestAccounts", []);
      await initializeApp(p, accounts[0]);
    } catch (err) {
      console.log(err)
      notifyFailure(err);
    }
  }

  async function getProvider() {
    const provider = await detectEthereumProvider();
    if (!provider) throw "Lukso extension not detected. Please install";
    if (provider.isMetaMask) throw "Please disable all other web3 extensions";
    return provider;
  }

  return (
    <ThemeProvider theme={theme}>
      {
        signer ?  <Grid container>
        <Grid xs={12} sm={2}>
          <NavBar/>
        </Grid>
        <Grid xs={12} sm={10}>
          {
            signer ?
            <Component connectUP={connectUP} getProvider={getProvider} signer={signer} upAddress={upAddress} extensionAddress={extensionAddress} {...pageProps} />
            :
            <div className={styles.container}>
              <main className={styles.main}>
                <Button
                  disabled={disableConnectBtn}
                  variant="contained"
                  onClick={connectUP}
                >
                  Connect a Universal Profile
                </Button>
                <ToastContainer />
              </main>
            </div>
          }
        </Grid>
      </Grid>
      :
      <Grid container>
        <Grid xs={12} >
          {
            signer ?
            <Component connectUP={connectUP} getProvider={getProvider} signer={signer} upAddress={upAddress} extensionAddress={extensionAddress} {...pageProps} />
            :
            <div className={styles.container}>
              <main className={styles.main}>
                <Button
                  disabled={disableConnectBtn}
                  variant="contained"
                  onClick={connectUP}
                >
                  Connect a Universal Profile
                </Button>
                <ToastContainer />
              </main>
            </div>
          }
        </Grid>
      </Grid>
      }
     
    </ThemeProvider>
  );
}

export default MyApp;
