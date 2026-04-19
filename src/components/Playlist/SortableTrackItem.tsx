import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./Playlist.module.scss";
import type { Track } from "../../types/track";

type Props = {
  track: Track;
  onRemove?: (id: string) => void;
  showDragHandle?: boolean;
  onPlay?: (track: Track, opts?: { preview?: boolean; toggle?: boolean }) => void;
  currentTrack?: Track | null;
  isPlaying?: boolean;
  previewUnavailable?: boolean;
};

export default function SortableTrackItem({ track, onRemove, showDragHandle = true,onPlay,currentTrack,isPlaying, previewUnavailable = false, }: Props) {
  const isOverlay = !onRemove;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `playlist-${track.id}`});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isActive = currentTrack?.id === track.id;
  const isActivePlaying = !previewUnavailable && currentTrack?.id === track.id && isPlaying;

  const handlePlay = () => {
    if (previewUnavailable) return;

    if (isActive) {
      onPlay?.(track, { preview: false, toggle: true });
    } else {
      onPlay?.(track, { preview: false });
    }
  };
  
  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isOverlay ? {} : attributes)}
      className={`${styles.trackItem} ${isActive ? styles.active : ""}`}
    >
      <div
        onClick={handlePlay}
        className={`${styles.trackItemInner} ${previewUnavailable ? styles.noPreview : ""}`}
      >

        {showDragHandle && (
          <div {...(isOverlay ? {} : listeners)} className={styles.dragHandle}>
            ⠿
          </div>
        )}

        <div
          className={styles.albumWrapper}
          onClick={(e) => {
            e.stopPropagation();
            handlePlay();
          }}
          aria-disabled={previewUnavailable}
        >
          <img
            src={track.imageUrl}
            alt={track.name}
            className={styles.albumImage}
          />

          <div className={styles.overlay}>
            {!previewUnavailable && currentTrack?.id === track.id && isPlaying ? "⏸" : "▶️"}
          </div>
        </div>

        <div className={styles.trackInfo}>
          <p className={styles.trackName}>{track.name}</p>
          <p className={styles.artistName}>{track.artist}</p>
        </div>

        
        <div 
          className={styles.waveform}
          style={{
            opacity: isActivePlaying ? 1 : 0,
            width: isActivePlaying ? "180px" : "0px",
          }}
        >
            {Array.from({ length: 60 }).map((_, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.05}s` }} />
            ))}
        </div>
        
        <div className={styles.trackActions}>
          {/* <p className={styles.trackDuration}>
            {formatDuration(track.duration)}
          </p> */}
          <div className={styles.buttonSlot}>
            {onRemove && (
              <button
                onClick={() => onRemove(track.id)}
                className={styles.removeButton}
              >
                Remove
              </button>
            )}
          </div>
        </div>
     </div> 
    </li>
  );
}
