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

export default function Home() {
  const [signer, setSigner] = useState();
  const [signerAddress, setSignerAddress] = useState("");
  const [quota, setQuota] = useState();
  const [transferAddress, setTransferAddress] = useState("");

  const notifySuccess = (txHash) =>
    toast.success(`Transaction successful: ${txHash}`, { closeOnClick: false });
  const notifyFailure = (error) =>
    toast.error(`Transaction failed: ${error}`, { closeOnClick: false });

  async function sendTestTransaction() {
    // Get browser extension EOA address
    const erc725 = new ERC725(
      LSP6Schema,
      signerAddress,
      signer.provider.provider
    );
    const result = await erc725.getData("AddressPermissions[]");
    // Just assume the first one is the UP browser extension.
    const browserExtensionAddress = result.value[0];

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
    }
  }

  useEffect(() => {
    if (signerAddress === "") return;
    async function fetchQuota() {
      try {
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
        setQuota(response.data);
      } catch (err) {
        console.log("failed to fetch quota: ", err);
      }
    }
    fetchQuota();
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
    setSignerAddress(accounts[0]);
    setSigner(signer);
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Baton</title>
        <meta name="description" content="Lukso relayer service" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        {signer ? (
          <div>
            <h2>Connected to Universal Profile: {signerAddress}</h2>
            <div>Quota: {quota?.quota}</div>
            <div>
              Total Quota: {quota?.totalQuota} <button>Increase Quota</button>
            </div>
            <div>Resets At: {new Date(quota?.resetDate).toLocaleString()} </div>
            <div>
              <h3>Send 0.1 LYX to someone to test out our relayer!</h3>
              <input
                size="40"
                onChange={(e) => setTransferAddress(e.target.value)}
                type="text"
                placeholder="recipient address"
              />
              <button onClick={sendTestTransaction}>
                Send Test Transaction
              </button>
            </div>
          </div>
        ) : (
          <button onClick={connectUP}>Connect Universal Profile</button>
        )}
        <ToastContainer />
      </main>
    </div>
  );
}
