import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";
import UniversalProfileContract from "@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json";
import KeyManagerContract from "@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json";
import Link from "next/link";
import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from "ethers";
import axios from "axios";
import { ERC725 } from "@erc725/erc725.js";
import LSP6Schema from "@erc725/erc725.js/schemas/LSP6KeyManager.json";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import QuotaModal from "../components/quotaModal";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Link2 from "@mui/material/Link";
import { CircularProgress } from "@mui/material";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

export default function Home() {
  const [signer, setSigner] = useState();
  const [signerAddress, setSignerAddress] = useState("");
  const [upQuota, setUPQuota] = useState();
  const [signerQuota, setSignerQuota] = useState();
  const [transferAddress, setTransferAddress] = useState("");
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [sendingTransaction, setSendingTransaction] = useState(false);
  const [browserExtensionAddress, setBrowserExtensionAddress] = useState("");

  const notifySuccess = (txHash) =>
    toast.success(`Transaction successful: ${txHash}`, {
      closeOnClick: false,
      draggable: false,
    });
  const notifyFailure = (error) =>
    toast.error(`Transaction failed: ${error}`, {
      closeOnClick: false,
      draggable: false,
    });

  async function handleIncreaseQuota() {
    const message = ethers.utils.solidityKeccak256(
      ["address"],
      [browserExtensionAddress]
    );

    const signatureObject = await signer.provider.send("eth_sign", [
      signerAddress,
      message,
    ]);

    console.log("signature: ", signatureObject.signature);
  }

  async function sendTestTransaction() {
    console.log(transferAddress);
    if (transferAddress === "")
      return notifyFailure("Please enter a valid address");

    // Create contract instances
    const myUniversalProfile = new ethers.Contract(
      signerAddress,
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

    // Use random channelID we don't have any nonce order issues.
    const channelId = Math.floor(Math.random() * 100);
    const nonce = await KeyManager.getNonce(browserExtensionAddress, channelId);
    const network = await signer.provider.getNetwork();
    const message = ethers.utils.solidityKeccak256(
      ["uint", "address", "uint", "bytes"],
      [network.chainId, keyManagerAddress, nonce.toString(), abiPayload]
    );

    const signatureObject = await signer.provider.send("eth_sign", [
      signerAddress,
      message,
    ]);
    const signature = signatureObject.signature;
    try {
      setSendingTransaction(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_RELAYER_HOST}/v1/execute`,
        {
          address: signerAddress,
          transaction: {
            nonce: nonce.toString(),
            abi: abiPayload,
            signature: signature,
          },
        }
      );
      console.log(response);
      notifySuccess(response.data.transactionHash);
    } catch (err) {
      notifyFailure(err?.response?.data?.error);
    } finally {
      setSendingTransaction(false);
    }
  }

  useEffect(() => {
    if (signerAddress === "") return;
    async function fetchQuotas() {
      try {
        // Get UP quota.
        const timestamp = new Date().getTime();
        const message = ethers.utils.solidityKeccak256(
          ["address", "uint"],
          [signerAddress, timestamp]
        );
        const signature = await signer.provider.send("eth_sign", [
          signerAddress,
          ethers.utils.arrayify(message),
        ]);
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_RELAYER_HOST}/v1/quota`,
          {
            address: signerAddress,
            timestamp: timestamp,
            signature: signature,
          }
        );
        console.log(response);
        setUPQuota(response.data);
        // Get signer quota.
        const timestamp2 = new Date().getTime();
        const message2 = ethers.utils.solidityKeccak256(
          ["address", "uint"],
          [browserExtensionAddress, timestamp]
        );
        const signature2 = await signer.provider.send("eth_sign", [
          signerAddress,
          ethers.utils.arrayify(message2),
        ]);
        const response2 = await axios.post(
          `${process.env.NEXT_PUBLIC_RELAYER_HOST}/v1/quota`,
          {
            address: browserExtensionAddress,
            timestamp: timestamp2,
            signature: signature2,
          }
        );
        console.log(response2);
        setSignerQuota(response2.data);
      } catch (err) {
        console.log("failed to fetch quota: ", err);
      }
    }
    fetchQuotas();
  }, [signerAddress]);

  async function connectUP() {
    const provider = await detectEthereumProvider();
    if (!provider)
      return alert(
        "Lukso Universal Profile browser extension was not detected. Please install and try again."
      );

    if (provider.isMetaMask)
      return alert(
        "This app only works with the Lukso universal profile browser extension, please disable all other web3 extensions"
      );

    const p = new ethers.providers.Web3Provider(provider);
    const accounts = await p.send("eth_requestAccounts", []);
    const signer = p.getSigner();
    const chainId = await signer.getChainId();
    if (chainId !== 2828) alert("Please connect to the lukso L16 testnet");

    // Get browser extension EOA address
    const erc725 = new ERC725(LSP6Schema, accounts[0], provider);
    const result = await erc725.getData("AddressPermissions[]");
    // Just assume the first one is the UP browser extension.
    const extensionAddress = result.value[0];

    setBrowserExtensionAddress(extensionAddress);
    setSignerAddress(accounts[0]);
    setSigner(signer);
  }

  // TODO: This isn't working for some reason...
  // window.ethereum.on("accountsChanged", (addresses) => {
  //   console.log("accounts changed");
  //   connectUP();
  // });

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
            <Typography
              style={{ marginBottom: "10px" }}
              component="div"
              variant="subtitle2"
              gutterBottom
            >
              By default, each universal profile gets a total quota. This will
              be used up first by any transaction that executes on this UP
            </Typography>
            <Card sx={{ minWidth: 275 }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Universal Profile: {signerAddress}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Quota:{" "}
                  {upQuota?.quota.toLocaleString(
                    undefined, // leave undefined to use the visitor's browser
                    // locale or a string like 'en-US' to override it.
                    { minimumFractionDigits: 0 }
                  )}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Total Quota:{" "}
                  {upQuota?.totalQuota.toLocaleString(
                    undefined, // leave undefined to use the visitor's browser
                    // locale or a string like 'en-US' to override it.
                    { minimumFractionDigits: 0 }
                  )}{" "}
                </Typography>
                <Typography variant="body2">
                  Resets At: {new Date(upQuota?.resetDate).toLocaleString()}{" "}
                </Typography>
              </CardContent>
            </Card>

            <Typography
              style={{ marginBottom: "10px", marginTop: "10px" }}
              component="div"
              variant="subtitle2"
              gutterBottom
            >
              At any time you can add a signer. This signer will have a quota
              separate from the UP. The signer's quota can be increased by
              signing up for one of our pro plans.
            </Typography>
            <Card sx={{ minWidth: 275, marginTop: "10px" }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Signer: {browserExtensionAddress}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Quota:{" "}
                  {signerQuota?.quota.toLocaleString(
                    undefined, // leave undefined to use the visitor's browser
                    // locale or a string like 'en-US' to override it.
                    { minimumFractionDigits: 0 }
                  )}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Total Quota:{" "}
                  {signerQuota?.totalQuota.toLocaleString(
                    undefined, // leave undefined to use the visitor's browser
                    // locale or a string like 'en-US' to override it.
                    { minimumFractionDigits: 0 }
                  )}{" "}
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => handleIncreaseQuota()}
                  >
                    Increase Quota
                  </Button>
                </Typography>
                <Typography variant="body2">
                  Resets At: {new Date(signerQuota?.resetDate).toLocaleString()}{" "}
                </Typography>
              </CardContent>
            </Card>

            <div style={{ maxWidth: "430px", marginTop: "30px" }}>
              <Typography variant="subtitle" gutterBottom component="div">
                Send 0.1 LYX to someone to test out our relayer!
              </Typography>
              <Typography variant="subtitle2" gutterBottom component="div">
                Don't have any LYX? Request some at the{" "}
                <Link2 href="https://faucet.l16.lukso.network/">faucet</Link2>
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
          <Button variant="outlined" onClick={connectUP}>
            Connect a Universal Profile
          </Button>
        )}
        {showQuotaModal ? <QuotaModal /> : null}

        <ToastContainer />
      </main>
    </div>
  );
}
