import { useDraggable } from "@dnd-kit/core";
import styles from "./SearchResults.module.scss";
import type { Track } from "../../types/track";
import { formatDuration } from "../../utils/formatDuration";

type Props = {
  track: Track;
  onAdd: (track: Track) => void;
  onPlay: (track: Track, opts?: { preview?: boolean; toggle?: boolean }) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  stopPreview: () => void;
  isHoverPreview: boolean;
  previewUnavailable?: boolean;
};

export default function SearchResultTrackItem({
  track,
  onAdd,
  onPlay,
  currentTrack,
  isPlaying,
  stopPreview,
  isHoverPreview,
  previewUnavailable = false,
}: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `search-${track.id}`,
    data: track,
  });

  const isHoverDevice = window.matchMedia("(hover: hover)").matches;

  const isCurrentPlaying =
    currentTrack?.id === track.id &&
    isPlaying &&
    (isHoverPreview || !isHoverDevice);
  const isActive = currentTrack?.id === track.id;

  const handleMobilePlayToggle = () => {
    if (isHoverDevice || previewUnavailable) return;

    const isSameTrack = currentTrack?.id === track.id;
    if (isSameTrack) {
      onPlay(track, { preview: false, toggle: true });
    } else {
      onPlay(track, { preview: false });
    }
  };

  return (
    <li
      ref={setNodeRef}
      data-search-track-id={track.id}
      {...attributes}
      {...listeners}
      className={`${styles.trackItem} ${isActive ? styles.active : ""}`}
      style={{ opacity: isDragging ? 0.3 : 1 }}

      onMouseEnter={() => {
        if (!isHoverDevice || previewUnavailable) return;
        onPlay(track, { preview: true });
      }}

      onMouseLeave={() => {
        if (!isHoverDevice || previewUnavailable) return;
        stopPreview();
      }}

    >
      <div className={styles.left}>
        <div className={styles.dragHandle}>
          <div className={`${styles.albumWrapper} ${previewUnavailable ? styles.noPreview : ""}`}>
            <img
              src={track.imageUrl}
              alt={`${track.name} cover`}
              className={styles.albumImage}
            />

            <button
              type="button"
              className={styles.mobilePlayButton}
              disabled={previewUnavailable}
              aria-disabled={previewUnavailable}
              aria-label={
                previewUnavailable
                  ? `No preview available for ${track.name}`
                  : currentTrack?.id === track.id && isPlaying
                  ? `Pause ${track.name}`
                  : `Play ${track.name}`
              }
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handleMobilePlayToggle();
              }}
            >
              <span aria-hidden="true">
                {!previewUnavailable && currentTrack?.id === track.id && isPlaying ? "⏸" : "▶️"}
              </span>
            </button>
          </div>
        </div>

        <div className={styles.trackInfo}>
          <p className={styles.trackName}>{track.name}</p>
          <p className={styles.artistName}>{track.artist}</p>
        </div>
      </div>

      <div
        className={styles.waveform}
        style={{
          opacity: isCurrentPlaying ? 1 : 0,
          width: "180px",
        }}
      >
        {Array.from({ length: 60 }).map((_, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.05}s` }} />
        ))}
      </div>

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
  );
}
