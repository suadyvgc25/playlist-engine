import styles from "./Header.module.scss";

type HeaderProps = {
  isLoggedIn?: boolean;
  userName?: string;
};

export default function Header({
  isLoggedIn = false,
  userName = "User",
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.logo}>Playlist Engine</h1>

      <div className={styles.authStatus}>
        {isLoggedIn ? (
          <>
            <span>Logged in as {userName}</span>
            <button>Log Out</button>
          </>
        ) : (
          <span>Logged out</span>
        )}
      </div>
    </header>
  );
}