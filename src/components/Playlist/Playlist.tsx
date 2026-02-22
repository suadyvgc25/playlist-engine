import styles from "./Playlist.module.scss";

type Track = {
  id: string;
  name: string;
  artist: string;
};

const mockPlaylistTracks: Track[] = [
  { id: "1", name: "Blinding Lights", artist: "The Weeknd" },
];

export default function Playlist() {
  return (
    <div className={styles.playlist}>
      <input
        type="text"
        defaultValue="My Playlist"
        className={styles.titleInput}
      />

      <ul className={styles.trackList}>
        {mockPlaylistTracks.map((track) => (
          <li key={track.id} className={styles.trackItem}>
            <div>
              <strong>{track.name}</strong>
              <p>{track.artist}</p>
            </div>
            <button className={styles.removeButton}>Remove</button>
          </li>
        ))}
      </ul>
      <div className={styles.actions}>
        <button className={styles.clearButton}>Clear All</button>
        <button className={styles.saveButton}>Save Playlist</button>
      </div>
    </div>
  );
}