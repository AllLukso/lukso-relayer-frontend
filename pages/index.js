import { useEffect, useState } from "react";
import Head from "next/head";
import UniversalProfileContract from "@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json";
import KeyManagerContract from "@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json";
import { ERC725 } from "@erc725/erc725.js";
import LSP6Schema from "@erc725/erc725.js/schemas/LSP6KeyManager.json";
import { ethers } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";
import axios from "axios";
import styles from "../styles/Home.module.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import QuotaModal from "../components/quotaModal";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import { CircularProgress } from "@mui/material";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

const DEFAULT_QUOTA = {
  quota: 'Click the "Fetch Quota" button',
  totalQuota: 'Click the "Fetch Quota" button',
  resetDate: new Date(0),
};

const BLOCK_EXPLORER = process.env.NEXT_PUBLIC_BLOCK_EXPLORER;

export default function Home() {
  const [signer, setSigner] = useState();
  const [upAddress, setUpAddress] = useState("");
  const [extensionAddress, setExtensionAddress] = useState("");
  const [upQuota, setUPQuota] = useState(DEFAULT_QUOTA);
  const [extensionQuota, setExtensionQuota] = useState(DEFAULT_QUOTA);
  const [transferAddress, setTransferAddress] = useState("");
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [sendingTransaction, setSendingTransaction] = useState(false);
  const [disableConnectBtn, setDisableConnectBtn] = useState(true);

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

    setExtensionQuota(DEFAULT_QUOTA);
    setUPQuota(DEFAULT_QUOTA);
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
      notifyFailure(err);
    }
  }

  async function fetchExtensionQuota() {
    try {
      const extensionResp = await fetchQuota(extensionAddress, upAddress);
      setExtensionQuota(extensionResp.data);
    } catch (err) {
      notifyFailure("failed to fetch quota");
    }
  }

  async function fetchUPQuota() {
    try {
      const upResp = await fetchQuota(upAddress, upAddress);
      setUPQuota(upResp.data);
    } catch (err) {
      notifyFailure("failed to fetch quota");
    }
  }

  async function fetchQuota(addr, signerAddr) {
    const time = new Date().getTime();
    const m = ethers.utils.solidityKeccak256(["address", "uint"], [addr, time]);
    const sigObject = await signer.provider.send("eth_sign", [signerAddr, m]);
    return await axios.post(
      `${process.env.NEXT_PUBLIC_RELAYER_HOST}/v1/quota`,
      {
        address: addr,
        timestamp: time,
        signature: sigObject.signature,
      }
    );
  }

  async function getProvider() {
    const provider = await detectEthereumProvider();
    if (!provider) throw "Lukso extension not detected. Please install";
    if (provider.isMetaMask) throw "Please disable all other web3 extensions";
    return provider;
  }

  async function handleIncreaseQuota() {
    setShowQuotaModal(true);
  }

  async function sendTestTransaction() {
    if (transferAddress === "") return notifyFailure("Enter a valid address");

    // Create contract instances
    const myUniversalProfile = new ethers.Contract(
      upAddress,
      UniversalProfileContract.abi,
      signer
    );

    const keyManagerAddress = await myUniversalProfile.owner();
    const KeyManager = new ethers.Contract(
      keyManagerAddress,
      KeyManagerContract.abi,
      signer
    );

    const abiPayload = myUniversalProfile.interface.encodeFunctionData(
      "execute",
      [
        0, // Operation type: CALL
        transferAddress, // Recipient address
        ethers.utils.parseEther("0.1"), // Value
        "0x", // Data
      ]
    );

    const channelId = 224;
    const nonce = await KeyManager.getNonce(extensionAddress, channelId);
    const network = await signer.provider.getNetwork();
    const message = ethers.utils.solidityKeccak256(
      ["uint", "address", "uint", "bytes"],
      [network.chainId, keyManagerAddress, nonce.toString(), abiPayload]
    );

    const signatureObject = await signer.provider.send("eth_sign", [
      upAddress,
      message,
    ]);
    const signature = signatureObject.signature;
    try {
      setSendingTransaction(true);
      const resp = await axios.post(
        `${process.env.NEXT_PUBLIC_RELAYER_HOST}/v1/execute`,
        {
          address: upAddress,
          transaction: {
            nonce: nonce.toString(),
            abi: abiPayload,
            signature: signature,
          },
        }
      );
      const hash = resp.data.transactionHash;
      notifySuccess(
        <Link href={`${BLOCK_EXPLORER}/tx/${hash}/internal-transactions`}>
          View Transaction
        </Link>
      );
    } catch (err) {
      notifyFailure(`${err?.response?.data?.error}`);
    } finally {
      setSendingTransaction(false);
    }
  }

  function handleQuotaDialogClose() {
    setShowQuotaModal(false);
  }

  async function handleQuotaDialogSubmit(quotaIncrease) {
    const message = ethers.utils.solidityKeccak256(
      ["address"],
      [extensionAddress]
    );

    const signatureObject = await signer.provider.send("eth_sign", [
      upAddress,
      message,
    ]);

    console.log("increase quota by: ", quotaIncrease);

    setShowQuotaModal(false);
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Baton</title>
        <meta name="description" content="Lukso relayer service" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>

      <main className={styles.main}>
        <Typography variant="h2" gutterBottom>
          <b>Baton</b>, a Lukso relayer
        </Typography>
        {signer ? (
          <div style={{ maxWidth: "600px" }}>
            <Typography component="div" variant="h5" gutterBottom>
              Universal Profile
            </Typography>
            <Typography
              style={{ marginBottom: "10px" }}
              component="div"
              variant="subtitle2"
              gutterBottom
            >
              By default, each universal profile gets a total quota of 650,000
              gas per month.
            </Typography>
            <Card sx={{ minWidth: 275 }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Universal Profile: {upAddress}
                </Typography>
                <Button variant="outlined" onClick={connectUP}>
                  Change connected UP
                </Button>
                <div style={{ marginTop: "20px", marginBottom: "10px" }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={fetchUPQuota}
                  >
                    Fetch Quota
                  </Button>
                </div>
                <Typography variant="body2" gutterBottom>
                  <b>Quota: </b>
                  {upQuota?.quota.toLocaleString(
                    undefined, // leave undefined to use the visitor's browser
                    // locale or a string like 'en-US' to override it.
                    { minimumFractionDigits: 0 }
                  )}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <b>Total Quota: </b>
                  {upQuota?.totalQuota.toLocaleString(
                    undefined, // leave undefined to use the visitor's browser
                    // locale or a string like 'en-US' to override it.
                    { minimumFractionDigits: 0 }
                  )}{" "}
                </Typography>
                <Typography variant="body2">
                  <b>Resets At: </b>{" "}
                  {new Date(upQuota?.resetDate).toLocaleString()}{" "}
                </Typography>
              </CardContent>
            </Card>
            <div style={{ maxWidth: "430px", marginTop: "30px" }}>
              <Typography variant="subtitle" gutterBottom component="div">
                Send 0.1 LYX to someone to test out our relayer!
              </Typography>
              <Typography variant="subtitle2" gutterBottom component="div">
                Don't have any LYX? Request some at the{" "}
                <Link href="https://faucet.l16.lukso.network/">faucet</Link>
              </Typography>
              <TextField
                style={{ marginTop: "15px" }}
                fullWidth
                label="Recipient Address 0x..."
                size="small"
                variant="outlined"
                onChange={(e) => setTransferAddress(e.target.value)}
                type="text"
              />
              <Box sx={{ position: "relative" }}>
                <Button
                  style={{ marginTop: "10px" }}
                  variant="contained"
                  onClick={sendTestTransaction}
                >
                  Send LYX
                </Button>
                {sendingTransaction && (
                  <CircularProgress
                    size={24}
                    sx={{
                      color: "green",
                      position: "absolute",
                      top: "53%",
                      left: "55%",
                      marginTop: "-12px",
                      marginLeft: "-12px",
                    }}
                  />
                )}
              </Box>
            </div>
          </div>
        ) : (
          <Button
            disabled={disableConnectBtn}
            variant="outlined"
            onClick={connectUP}
          >
            Connect a Universal Profile
          </Button>
        )}
        <QuotaModal
          open={showQuotaModal}
          onClose={handleQuotaDialogClose}
          onSubmit={handleQuotaDialogSubmit}
        />
        <ToastContainer />
      </main>
    </div>
  );
}
