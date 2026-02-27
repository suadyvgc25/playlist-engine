import styles from "./Playlist.module.scss";
import type { Track } from "../../types/track";

type Props = {
  name: string;
  tracks: Track[];
  onNameChange: (value: string) => void;
  onRemove: (trackId: string) => void;
  onClear: () => void;
  playlistCount: number;
};

export default function Playlist({
  name,
  tracks,
  onNameChange,
  onRemove,
  onClear,
  playlistCount,
}: Props) {
  return (
    <div className={styles.playlist}>
      <div className={styles.headerRow}>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className={styles.titleInput}
        />
        <span className={styles.count}>({playlistCount})</span>
      </div>

      <ul className={styles.trackList}>
        {tracks.map((track) => (
          <li key={track.id} className={styles.trackItem}>
            <div>
              <strong>{track.name}</strong>
              <p>{track.artist}</p>
            </div>

            <button
              className={styles.removeButton}
              onClick={() => onRemove(track.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className={styles.actions}>
        <button className={styles.clearButton} onClick={onClear}>Clear All</button>
        <button className={styles.saveButton} disabled={tracks.length === 0}>
          Save Playlist
        </button>
      </div>
    </div>
  );
}