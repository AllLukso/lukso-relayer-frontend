import react, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";

function Dashboard() {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { query } = useRouter();

  useEffect(() => {
    async function fetchUser() {
      const userEmail = localStorage.getItem("user_email");
      const resp = await axios.get(
        `${process.env.NEXT_PUBLIC_RELAYER_HOST}/v1/user/${userEmail}`
      );
      setVerified(resp.data.verified);
      setLoading(false);
      setUser(resp.data);
    }
    fetchUser();
  }, []);

  useEffect(() => {
    if (!query.authToken) return;

    localStorage.setItem("user_auth_token", query.authToken);
  });

  async function resendVerification() {
    if (!user) return;

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_RELAYER_HOST}/v1/user/resend_verification`,
      {
        email: user.email,
      }
    );

    if (response.status === 200) {
      alert("resent verification pleasea check your email");
    } else {
      alert("failed to resend verification");
    }
  }

  return (
    <div>
      {!verified && !loading ? (
        <div>
          an email has been sent to {user.email} please verify your account.
          <button onClick={resendVerification}>Resend verification</button>
        </div>
      ) : verified && !loading ? (
        <div>
          <h1>Welcome to Lukso Baton</h1>
          <h2>Please register a controller address to start making requests</h2>
          <label>Controller address</label>
          <input type="text" placeholder="0x..." />
          <button>Register</button>
        </div>
      ) : (
        <div>Loading</div>
      )}
    </div>
  );
}

export default Dashboard;
