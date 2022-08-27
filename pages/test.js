import react, { useState, useEffect } from "react";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import "react-toastify/dist/ReactToastify.css";
import Box from "@mui/material/Box";
import LoadingButton from "@mui/lab/LoadingButton";
import styles from "../styles/Home.module.css";
import { ERC725 } from "@erc725/erc725.js";
import UniversalProfileContract from "@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json";
import KeyManagerContract from "@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json";
import Web3 from "web3";
import { ethers } from "ethers";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import Link from "next/link";

const RPC_ENDPOINT = "https://rpc.l16.lukso.network";
// Parameters for ERC725 Instance
const BLOCK_EXPLORER = process.env.NEXT_PUBLIC_BLOCK_EXPLORER;
const IPFS_GATEWAY = "https://2eff.lukso.dev/ipfs/";
const config = { ipfsGateway: IPFS_GATEWAY };
const web3Provider = new Web3.providers.HttpProvider(RPC_ENDPOINT);
const missionSchema = [
  {
    name: "Mission",
    key: "0x9fc8b2da3af96a615bb40a1f0bbf185352bde5bfdfcec6e43c58a5f5b4caecf9",
    keyType: "Singleton",
    valueType: "string",
    valueContent: "String",
  },
];

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

function Test({ upAddress, getProvider, extensionAddress, signer }) {
  const [sendingTransaction, setSendingTransaction] = useState(false);
  const [currentMission, setCurrentMission] = useState("");
  const [mission, setMission] = useState("");

  useEffect(() => {
    if (upAddress === "" || upAddress === undefined) return;
    async function getData() {
      await fetchUPData();
    }
    getData();
  }, []);

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
        <Link href={`${BLOCK_EXPLORER}/tx/${hash}`}>View Transaction</Link>
      );
    } catch (err) {
      console.log(err);
      notifyFailure(`${err?.response?.data?.error}`);
    } finally {
      setSendingTransaction(false);
    }
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
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
          <ToastContainer />
        </div>
      </main>
    </div>
  );
}

export default Test;
