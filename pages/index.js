import { useEffect, useState } from "react";
import Head from "next/head";
import "isomorphic-fetch";
import { ethers } from "ethers";
import axios from "axios";
import styles from "../styles/Home.module.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import QuotaModal from "../components/quotaModal";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

const DEFAULT_QUOTA = {
  quota: 'Click the "Fetch Quota" button',
  totalQuota: 'Click the "Fetch Quota" button',
  resetDate: new Date(0),
};

export default function Home({ connectUP, signer, upAddress }) {
  const [upQuota, setUPQuota] = useState(DEFAULT_QUOTA);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);

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
    setUPQuota(DEFAULT_QUOTA);
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
    const resp = await axios.post(
      `${process.env.NEXT_PUBLIC_RELAYER_HOST}/v1/stripe/portal`,
      { upAddress }
    );
    window.location.href = resp.data.url;
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

    let priceId;
    if (quotaIncrease === "basic") {
      priceId = "price_1LWiB9FDrjI2b6r7nGusED32";
    } else if (quotaIncrease === "premium") {
      priceId = "FILL THIS In";
    }

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_RELAYER_HOST}/v1/stripe/session`,
      { priceId, upAddress }
    );
    window.location.href = response.data.url;

    setShowQuotaModal(false);
  }

  async function fetchUPData() {
    try {
      const resp = await axios.get(
        `${process.env.NEXT_PUBLIC_RELAYER_HOST}/v1/subscriptions/${upAddress}`
      );
      const subscriptions = resp.data.subscriptions;
      setSubscriptions(subscriptions);
    } catch (error) {
      console.log(error);
      return console.log("Failed to fetch subscriptions");
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
            By default, each universal profile gets a total quota of 650,000 gas
            per month.
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
                <Button size="small" variant="contained" onClick={fetchUPQuota}>
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
          <div style={{ marginTop: "15px" }}>
            {subscriptions && subscriptions.length > 0 ? (
              <Button
                size="small"
                variant="contained"
                onClick={handleStripePortal}
              >
                Manage Subscription
              </Button>
            ) : (
              <Button
                style={{ marginRight: "10px" }}
                size="small"
                variant="contained"
                onClick={handleIncreaseQuota}
              >
                Increase Quota
              </Button>
            )}
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
