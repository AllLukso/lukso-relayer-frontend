import react from "react";
import styles from "../styles/Home.module.css";
import Approve from "../components/approve";

function Approvals({upAddress, signer}) {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        {" "}
        <Approve upAddress={upAddress} signer={signer}/>
      </main>
    </div>
  );
}

export default Approvals;
