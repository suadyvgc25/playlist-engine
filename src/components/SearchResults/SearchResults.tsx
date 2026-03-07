import styles from "./SearchResults.module.scss";
import type { Track } from "../../types/track";

type Props = {
  tracks: Track[];
  onAdd: (track: Track) => void;
  resultsCount: number;
  loading?: boolean;
  error?: string | null;
  query?: string;
};

export default function SearchResults({
  tracks,
  onAdd,
  resultsCount
}: Props) {
  return (
    <div className={styles.results}>
      <div className={styles.headerRow}>
        <h2>Search Results</h2>
        <span className={styles.count}>({resultsCount})</span>
      </div>
      <ul className={styles.trackList}>
        {tracks.map((track) => (
          <li key={track.id} className={styles.trackItem}>
            <div>
              <strong>{track.name}</strong>
              <p>{track.artist}</p>
            </div>
            <button className={styles.addButton} onClick={() => onAdd(track)}>Add</button>
          </li>
        ))}
      </ul>
    </div>
  );
}