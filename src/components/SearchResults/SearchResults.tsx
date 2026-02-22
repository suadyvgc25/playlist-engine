import styles from "./SearchResults.module.scss";

type Track = {
  id: string;
  name: string;
  artist: string;
};

const mockTracks: Track[] = [
  { id: "1", name: "Blinding Lights", artist: "The Weeknd" },
  { id: "2", name: "Levitating", artist: "Dua Lipa" },
  { id: "3", name: "As It Was", artist: "Harry Styles" },
];

export default function SearchResults() {
  return (
    <div className={styles.results}>
      <h2>Search Results</h2>

      <ul className={styles.trackList}>
        {mockTracks.map((track) => (
          <li key={track.id} className={styles.trackItem}>
            <div>
              <strong>{track.name}</strong>
              <p>{track.artist}</p>
            </div>
            <button className={styles.addButton}>Add</button>
          </li>
        ))}
      </ul>
    </div>
  );
}