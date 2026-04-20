import styles from "./SearchResults.module.scss";
import type { Track } from "../../types/track";
import SearchResultTrackItem from "./SearchResultTrackItem"

type Props = {
  tracks: Track[];
  onAdd: (track: Track) => void;
  resultsCount: number;
  loading?: boolean;
  error?: string | null;
  query?: string;
  onPlay: (track: Track, opts?: { preview?: boolean; toggle?: boolean }) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  stopPreview: () => void;
  isHoverPreview: boolean;
  tracksWithoutPreviews: Set<string>;
};

export default function SearchResults({
  tracks,
  onAdd,
  resultsCount,
  onPlay,
  currentTrack,
  isPlaying,
  stopPreview,
  isHoverPreview,
  tracksWithoutPreviews,
}: Props) {
  if (tracks.length === 0) {
    return null;
  }

  return (
    <div className={styles.results}>
      <div className={styles.headerRow}>
        <h2>Search Results</h2>
        <div className={styles.count}>
          {resultsCount} {resultsCount === 1 ? "song" : "songs"} found
        </div>
      </div>

      <ul className={styles.trackList}>
        {tracks.map((track) => (
          <SearchResultTrackItem
            key={track.id}
            track={track}
            onAdd={onAdd}
            onPlay={onPlay}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            stopPreview={stopPreview}
            isHoverPreview={isHoverPreview}
            previewUnavailable={tracksWithoutPreviews.has(track.id)}
          />
        ))}
      </ul>
    </div>
  );
}
