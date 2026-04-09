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
  onPlay: (track: Track, opts?: { preview?: boolean }) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  stopPreview: () => void;
  isHoverPreview: boolean;
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
          
          const isCurrentPlaying = currentTrack?.id === track.id && isPlaying && isHoverPreview;
          const isActive = isCurrentPlaying;
          const isHoverDevice = window.matchMedia("(hover: hover)").matches; 
          return (
            <li
              key={track.id}
              ref={setNodeRef}
              {...attributes}
              {...listeners} 
              className={`${styles.trackItem} ${
                isActive && isHoverPreview ? styles.active : ""
              }`}
              style={{
                opacity: isDragging ? 0.3 : 1,
              }}
              onMouseEnter={() => {
                if (!isHoverDevice) return;
                onPlay(track, { preview: true });
              }}
              onMouseLeave={() => {
                if (!isHoverDevice) return;
                stopPreview();
              }}

              
            >
            <div className={styles.left}>
              <div className={styles.dragHandle}
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
            </div>
              
              
              {/* 🔥 Waveform moved HERE */}
              {isCurrentPlaying && (
                <div
                  className={styles.waveform}
                  onClick={(e) => {
                    e.stopPropagation();
                    stopPreview();
                  }}
                >
                  {Array.from({ length: 60 }).map((_, i) => (
                    <span key={i} style={{ animationDelay: `${i * 0.05}s` }} />
                  ))}
                </div>
              )}

              <div className={styles.trackActions}>
                <div className={styles.playerSlot}>
                  {!isCurrentPlaying && (
                    <span className={styles.trackDuration}>
                      {formatDuration(track.duration)}
                    </span>
                  )}
                </div>

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