import styles from "./LoginHero.module.scss";
import { startSpotifyLogin } from "../../services/spotify/auth";
import AlbumMosaic from "../AlbumMosaic/AlbumMosaic";

export default function LoginHero() {
  return (
    <section className={styles.hero}>

      <AlbumMosaic />

      <div className={styles.overlay} />
      <div className={styles.loginCard}>
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
                src="/spotify-white.svg"
                alt="Spotify"
                className={styles.icon}
            />
            Log in with Spotify
            </button>

            <ul className={styles.features}>
              <li>
                <span className={styles.check}>✓</span>
                <span>Search Spotify tracks instantly</span>
              </li>

              <li>
                <span className={styles.check}>✓</span>
                <span>Preview songs and arrange the flow</span>
              </li>

              <li>
                <span className={styles.check}>✓</span>
                <span>Save finished playlists to Spotify</span>
              </li>
            </ul>
         </div>
       </div>
    </section>
  );
}
