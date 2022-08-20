import { useEffect, useState } from "react";
import Head from "next/head";
import UniversalProfileContract from "@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json";
import KeyManagerContract from "@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json";
import { ERC725 } from "@erc725/erc725.js";
import "isomorphic-fetch";
import erc725schema from "@erc725/erc725.js/schemas/LSP3UniversalProfileMetadata.json";
import { ethers } from "ethers";
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
import Web3 from "web3";
import LoadingButton from '@mui/lab/LoadingButton';

const DEFAULT_QUOTA = {
  quota: 'Click the "Fetch Quota" button',
  totalQuota: 'Click the "Fetch Quota" button',
  resetDate: new Date(0),
};

const missionSchema = [
  {
    name: "Mission",
    key: "0x9fc8b2da3af96a615bb40a1f0bbf185352bde5bfdfcec6e43c58a5f5b4caecf9",
    keyType: "Singleton",
    valueType: "string",
    valueContent: "String",
  },
];

const RPC_ENDPOINT = "https://rpc.l16.lukso.network";
// Parameters for ERC725 Instance
const BLOCK_EXPLORER = process.env.NEXT_PUBLIC_BLOCK_EXPLORER;
const IPFS_GATEWAY = "https://2eff.lukso.dev/ipfs/";
const config = { ipfsGateway: IPFS_GATEWAY };
const web3Provider = new Web3.providers.HttpProvider(RPC_ENDPOINT);

export default function Home({connectUP, getProvider, signer, upAddress, extensionAddress}) {
  const [upQuota, setUPQuota] = useState(DEFAULT_QUOTA);
  const [transferAddress, setTransferAddress] = useState("");
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [sendingTransaction, setSendingTransaction] = useState(false);
  const [currentMission, setCurrentMission] = useState("");
  const [mission, setMission] = useState("");
  const [subscriptions, setSubscriptions] = useState([])

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
    if (upAddress === "" || upAddress === undefined) return;
    async function getData() {
      await fetchUPData();
    }
    getData();
    setUPQuota(DEFAULT_QUOTA)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upAddress]);

  async function fetchUPQuota() {
    try {
      const upResp = await fetchQuota(upAddress, upAddress);
      setUPQuota(upResp.data);
      await fetchUPData();
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

  async function handleIncreaseQuota() {
    setShowQuotaModal(true);
  }

  async function handleStripePortal() {
    const resp = await axios.post(`${process.env.NEXT_PUBLIC_RELAYER_HOST}/v1/stripe/portal`, { upAddress })
    window.location.href = resp.data.url
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
      ["string"],
      [`I want to increase my quota to ${quotaIncrease}`]
    );

    const signatureObject = await signer.provider.send("eth_sign", [
      upAddress,
      message,
    ]);

    let priceId
    if (quotaIncrease === "basic") {
      priceId = "price_1LWiB9FDrjI2b6r7nGusED32"
    } else if (quotaIncrease === "premium") {
      priceId = "FILL THIS In"
    }

    const response = await axios.post(`${process.env.NEXT_PUBLIC_RELAYER_HOST}/v1/stripe/session`, { priceId, upAddress })
    window.location.href = response.data.url

    setShowQuotaModal(false);
  }

  async function fetchUPData() {
    try {
      const profile = new ERC725(
        missionSchema,
        upAddress,
        web3Provider,
        config
      );
      const data = await profile.fetchData("Mission");
      setCurrentMission(data.value);
      const resp = await axios.get(`${process.env.NEXT_PUBLIC_RELAYER_HOST}/v1/subscriptions/${upAddress}`)
      const subscriptions = resp.data.subscriptions
      setSubscriptions(subscriptions)
    } catch (error) {
      console.log(error);
      return console.log("This is not an ERC725 Contract");
    }
  }

  async function updateUPData() {
    if (!mission) throw "Please set a mission";

    const provider = await getProvider();
    const web3 = new Web3(provider);

    const universalProfileContract = new web3.eth.Contract(
      UniversalProfileContract.abi,
      upAddress
    );

    const keyManagerAddress = await universalProfileContract.methods
      .owner()
      .call();
    const KeyManager = new web3.eth.Contract(
      KeyManagerContract.abi,
      keyManagerAddress
    );

    const erc725 = new ERC725(missionSchema, upAddress, web3.currentProvider, {
      ipfsGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY,
    });

    const encodedData = erc725.encodeData({
      keyName: "Mission",
      value: mission,
    });

    const abiPayload = await universalProfileContract.methods[
      "setData(bytes32[],bytes[])"
    ](encodedData.keys, encodedData.values).encodeABI();

    const channelId = 224;
    const nonce = await KeyManager.methods
      .getNonce(extensionAddress, channelId)
      .call();
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
      setCurrentMission(mission);
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
          <Card
            style={{ backgroundColor: "#303150", color: "white" }}
            sx={{ minWidth: 275 }}
          >
            <CardContent>
              <Typography gutterBottom>
                Universal Profile: {upAddress}
              </Typography>
              <Button variant="contained" onClick={connectUP}>
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
          <div style={{marginTop: "15px"}}>
            {
              subscriptions && subscriptions.length > 0 ?               
              <Button size="small" variant="contained" onClick={handleStripePortal}>Manage Subscription</Button>
              :
              <Button style={{marginRight: "10px"}} size="small" variant="contained" onClick={handleIncreaseQuota}>Increase Quota</Button>

            }
          </div>
          <div style={{ maxWidth: "430px", marginTop: "30px" }}>
            <Typography variant="h5" gutterBottom component="div">
              Dummy App
            </Typography>
            <Typography variant="subtitle2" gutterBottom component="div">
              Set the mission of your Universal Profile.
            </Typography>
            <TextField
              style={{ marginTop: "15px" }}
              sx={{ input: { color: "white", border: "white" } }}
              variant="outlined"
              fullWidth
              label="Mission..."
              size="small"
              onChange={(e) => setMission(e.target.value)}
              type="text"
            />
            <Box sx={{ position: "relative" }}>
              <LoadingButton
                loading={sendingTransaction}
                style={{ marginTop: "10px" }}
                variant="contained"
                onClick={updateUPData}
              >
                Set Mission
              </LoadingButton>
            </Box>
            <p>Your Current Mission: {currentMission}</p>
          </div>
        </div>
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
