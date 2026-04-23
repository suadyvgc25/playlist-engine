import { useRef } from "react";
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
  isAdded?: boolean;
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
  isAdded = false,
}: Props) {
  const touchPlayHandledRef = useRef(false);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `search-${track.id}`,
    data: track,
  });

  const isHoverDevice = window.matchMedia("(hover: hover)").matches;
  const rowDragListeners = isHoverDevice ? listeners : {};
  const touchDragListeners = isHoverDevice ? {} : listeners;

  const isCurrentPlaying =
    currentTrack?.id === track.id &&
    isPlaying &&
    (isHoverPreview || !isHoverDevice);
  const showTrackWaveform = isCurrentPlaying && isHoverDevice;
  const isActive = currentTrack?.id === track.id;

  const handleMobilePlayToggle = () => {
    if (previewUnavailable) return;

    const isSameTrack = currentTrack?.id === track.id;
    if (isSameTrack) {
      onPlay(track, { preview: false, toggle: true });
    } else {
      onPlay(track, { preview: false });
    }
  };

  const handleDirectPlayPress = () => {
    touchPlayHandledRef.current = true;
    handleMobilePlayToggle();

    window.setTimeout(() => {
      touchPlayHandledRef.current = false;
    }, 400);
  };

  return (
    <li
      ref={setNodeRef}
      data-search-track-id={track.id}
      {...attributes}
      {...rowDragListeners}
      className={`${styles.trackItem} ${isActive ? styles.active : ""} ${showTrackWaveform ? styles.previewing : ""} ${isAdded ? styles.added : ""}`}
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
              onPointerDown={(e) => {
                e.stopPropagation();

                if (e.pointerType !== "mouse") {
                  e.preventDefault();
                  handleDirectPlayPress();
                }
              }}
              onTouchStart={(e) => {
                e.stopPropagation();

                if (!touchPlayHandledRef.current) {
                  e.preventDefault();
                  handleDirectPlayPress();
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (touchPlayHandledRef.current) return;
                handleMobilePlayToggle();
              }}
            >
              <span aria-hidden="true">
                {!previewUnavailable && currentTrack?.id === track.id && isPlaying ? "II" : "▶️"}
              </span>
            </button>
          </div>
        </div>

        <div className={styles.trackInfo} {...touchDragListeners}>
          <p className={styles.trackName}>{track.name}</p>
          <p className={styles.artistName}>{track.artist}</p>
        </div>

        <div className={styles.waveform}>
          {Array.from({ length: 160 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
      </div>

      <div className={styles.trackActions}>
        {!isCurrentPlaying && (
          <div className={styles.playerSlot}>
            <span className={styles.trackDuration}>
              {formatDuration(track.duration)}
            </span>
          </div>
        )}

        <button
          type="button"
          className={styles.mobilePreviewButton}
          disabled={previewUnavailable}
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
          {!previewUnavailable && currentTrack?.id === track.id && isPlaying ? "II" : "▶"}
        </button>

        <button
          className={styles.addButton}
          disabled={isAdded}
          aria-label={isAdded ? `${track.name} is already in your playlist` : `Add ${track.name}`}
          onClick={(e) => {
            e.stopPropagation();
            if (isAdded) return;
            onAdd(track);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {isAdded ? "Added" : "+ Add"}
        </button>
      </div>
    </li>
  );
}
