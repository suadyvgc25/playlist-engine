import { useEffect, useRef, useState } from "react";
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
  const touchPlayHandledRef = useRef(false);
  const [isMobileLayout, setIsMobileLayout] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 980px)").matches
  );

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
  const showTrackWaveform = isActivePlaying && !isMobileLayout;
  const mobileDragListeners = !isOverlay && isMobileLayout ? listeners : {};
  const handleDragListeners = !isOverlay && !isMobileLayout ? listeners : {};

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 980px)");
    const syncMobileLayout = () => setIsMobileLayout(mediaQuery.matches);

    syncMobileLayout();
    mediaQuery.addEventListener("change", syncMobileLayout);

    return () => {
      mediaQuery.removeEventListener("change", syncMobileLayout);
    };
  }, []);

  const handlePlay = () => {
    if (previewUnavailable) return;

    if (isActive) {
      onPlay?.(track, { preview: false, toggle: true });
    } else {
      onPlay?.(track, { preview: false });
    }
  };

  const handleDirectPlayPress = () => {
    touchPlayHandledRef.current = true;
    handlePlay();

    window.setTimeout(() => {
      touchPlayHandledRef.current = false;
    }, 400);
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
        className={`${styles.trackItemInner} ${previewUnavailable ? styles.noPreview : ""}`}
      >

        {showDragHandle && !isMobileLayout && (
          <div {...handleDragListeners} className={styles.dragHandle}>
            ⠿
          </div>
        )}

        <div
          className={styles.albumWrapper}
          aria-disabled={previewUnavailable}
        >
          <img
            src={track.imageUrl}
            alt={track.name}
            className={styles.albumImage}
          />

          <button
            type="button"
            className={styles.overlay}
            disabled={previewUnavailable}
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
              handlePlay();
            }}
          >
            {!previewUnavailable && currentTrack?.id === track.id && isPlaying ? "⏸" : "▶️"}
          </button>
        </div>

        <div className={styles.trackInfo} {...mobileDragListeners}>
          <p className={styles.trackName}>{track.name}</p>
          <p className={styles.artistName}>{track.artist}</p>
        </div>

        
        <div 
          className={styles.waveform}
          style={{
            opacity: showTrackWaveform ? 1 : 0,
            width: showTrackWaveform ? "180px" : "0px",
          }}
        >
            {Array.from({ length: 60 }).map((_, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.05}s` }} />
            ))}
        </div>
        
        <div className={styles.trackActions}>
          <div className={styles.buttonSlot}>
            {onRemove && (
              <button
                type="button"
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
                  handlePlay();
                }}
                className={styles.mobilePreviewButton}
              >
                {!previewUnavailable && currentTrack?.id === track.id && isPlaying ? "⏸" : "▶"}
              </button>
            )}

            {onRemove && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(track.id);
                }}
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
