import react, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  async function createAccount() {
    const response = await axios.post("http://localhost:3000/v1/user", {
      email,
      password,
      confirmPassword,
    });
    if (response.status === 200) {
      localStorage.setItem("user_email", email);
      router.push("/dashboard");
    }
  }

  return (
    <div>
      <input
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder="email"
      />
      <input
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="confirm password"
      />
      <input
        onChange={(e) => setConfirmPassword(e.target.value)}
        type="password"
        placeholder="confirm password"
      />
      <button onClick={createAccount}>Create Account</button>
    </div>
  );
}

export default SignUp;
