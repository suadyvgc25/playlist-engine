import styles from "./Header.module.scss";

type HeaderProps = {
  isLoggedIn?: boolean;
  userName?: string;
  onLogout: () => void;
};

export default function Header({
  isLoggedIn,
  userName,
  onLogout,
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.logo}>Playlist Engine</h1>

      <div className={styles.authStatus}>
        {isLoggedIn ? (
          <>
            <span>Logged in as {userName ?? "Spotify User"}</span>
            <button type="button" onClick={onLogout}>Log Out</button>
          </>
        ) : (
          <span>Logged out</span>
        )}
      </div>
    </header>
  );
}