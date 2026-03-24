import styles from "./SearchResults.module.scss";
import type { Track } from "../../types/track";
import { formatDuration } from "../../utils/formatDuration";
import { useDraggable } from "@dnd-kit/core";

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
        <div className={styles.count}>
          {resultsCount} {resultsCount === 1 ? "song" : "songs"} found
        </div>
      </div>
      <ul className={styles.trackList}>
        {tracks.map((track) => {
          const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
            id: `search-${track.id}`,
            data: track,
          });

          return (
            <li
              key={track.id}
              ref={setNodeRef}
              {...attributes}
              {...listeners} 
              className={styles.trackItem}
              style={{
                opacity: isDragging ? 0.3 : 1,
              }}
            >
            <div 
              
              className={styles.dragHandle}
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={track.imageUrl} 
                alt={`${track.name} cover`} 
                className={styles.albumImage} 
              />
            </div>  
              <div className={styles.trackInfo}>
                <p className={styles.trackName}>{track.name}</p>
                <p className={styles.artistName}>{track.artist}</p>
              </div>
              <div className={styles.trackActions}>
                <p className={styles.trackDuration}>{formatDuration(track.duration)}</p>
                <button 
                  className={styles.addButton} 
                  onClick={(e) => {
                    e.stopPropagation(); 
                    onAdd(track);
                  }}
                  onPointerDown={(e) => e.stopPropagation()} 
                >
                  + Add
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  );
}