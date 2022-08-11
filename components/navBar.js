import react from "react";
import styles from "../styles/NavBar.module.css";
import AppsIcon from "@mui/icons-material/Apps";

function NavBar() {
  return (
    <div className={styles.navbar}>
      <div className={styles.logo}>BATON</div>
      <ul className={styles.menu}>
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
      </ul>
    </div>
  );
}

export default NavBar;
