import react from "react";
import styles from "../styles/NavBar.module.css";
import AppsIcon from "@mui/icons-material/Apps";
import Link from "next/link"

function NavBar() {
  return (
    <div className={styles.navbar}>
      <div className={styles.logo}>BATON</div>
      <ul className={styles.menu}>
        <Link href="/">
          <li
            style={{
              display: "flex",
              alignItems: "center",
              borderLeft: "2px solid #0DBACC",
              paddingLeft: "5px",
              cursor: "pointer",
            }}
          >
            <AppsIcon style={{ marginRight: "10px" }} />
            Dashboard
          </li>
        </Link>
      </ul>
    </div>
  );
}

export default NavBar;
