import react, {useState, useEffect} from "react";
import styles from "../styles/NavBar.module.css";
import AppsIcon from "@mui/icons-material/Apps";
import Link from "next/link"
import PeopleIcon from '@mui/icons-material/People';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

function NavBar() {
  const [location, setLocation] = useState("")

  useEffect(() => {
    const url = window.location
    setLocation(url.pathname)
  }, [])

  function handleClick(path) {
    setLocation(path)
  }

  return (
    <div className={styles.navbar}>
      <div className={styles.logo}>BATON</div>
      <ul className={styles.menu}>
        <Link href="/">
          <li
            style={{
              display: "flex",
              alignItems: "center",
              borderLeft: location === "/" ? "2px solid #0DBACC" : null,
              paddingLeft: "5px",
              cursor: "pointer",
            }}
            onClick={() => handleClick("/")}
          >
            <AppsIcon style={{ marginRight: "10px" }} />
            Dashboard
          </li>
        </Link>
        <Link href="/approvals">
          <li
            style={{
              display: "flex",
              alignItems: "center",
              paddingLeft: "5px",
              borderLeft: location === "/approvals" ? "2px solid #0DBACC" : null,
              cursor: "pointer",
              marginTop: "20px",
            }}
            onClick={() => handleClick("/approvals")}
          >
            <PeopleIcon style={{ marginRight: "10px" }} />
            Approvals
          </li>
        </Link>
        <Link href="/transactions">
          <li
            style={{
              display: "flex",
              alignItems: "center",
              borderLeft: location === "/transactions" ? "2px solid #0DBACC" : null,
              paddingLeft: "5px",
              cursor: "pointer",
              marginTop: "20px"
            }}
            onClick={() => handleClick("/transactions")}
          >
            <FormatListBulletedIcon style={{ marginRight: "10px" }} />
            Transactions
          </li>
        </Link>
      </ul>
    </div>
  );
}

export default NavBar;
