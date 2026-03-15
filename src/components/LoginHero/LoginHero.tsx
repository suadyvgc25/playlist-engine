import styles from "./LoginHero.module.scss";
import { startSpotifyLogin } from "../../services/spotify/auth";
import AlbumMosaic from "../AlbumMosaic/AlbumMosaic";

export default function LoginHero() {
  return (
    <section className={styles.hero}>
      
      <AlbumMosaic />

      <div className={styles.overlay} />

      <div className={styles.content}>
        <h1 className={styles.title}>Playlist Engine</h1>

        <h2 className={styles.subtitle}>
          Create Playlists That Flow
        </h2>

        <p className={styles.description}>
          Search millions of tracks and build your perfect mix in seconds.
        </p>

        <button className={styles.loginButton} onClick={startSpotifyLogin}>
          <img
            src="/spotify-icon.svg"
            alt="Spotify"
            className={styles.icon}
          />
          Log in with Spotify
        </button>

        <ul className={styles.features}>
          <li>✓ Album artwork preview</li>
          <li>✓ Live playlist duration</li>
          <li>✓ Save directly to Spotify</li>
        </ul>
      </div>
    </section>
  );
}