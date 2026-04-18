import { useDraggable } from "@dnd-kit/core";
import { useRef } from "react";
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
};

export default function SearchResultTrackItem({
  track,
  onAdd,
  onPlay,
  currentTrack,
  isPlaying,
  stopPreview,
  isHoverPreview,
}: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `search-${track.id}`,
    data: track,
  });

  const startPos = useRef<{ x: number; y: number } | null>(null);

  const isHoverDevice = window.matchMedia("(hover: hover)").matches;

  const isCurrentPlaying =
    currentTrack?.id === track.id &&
    isPlaying &&
    (isHoverPreview || !isHoverDevice);

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={styles.trackItem}
      style={{ opacity: isDragging ? 0.3 : 1 }}

      onMouseEnter={() => {
        if (!isHoverDevice) return;
        onPlay(track, { preview: true });
      }}

      onMouseLeave={() => {
        if (!isHoverDevice) return;
        stopPreview();
      }}

    //   onPointerDown={(e) => {
    //     if (isHoverDevice) return;

    //     startPos.current = {
    //       x: e.clientX,
    //       y: e.clientY,
    //     };
    //   }}

      onClick={(e) => {
        if (isHoverDevice) return;
        // if (!startPos.current) return;

        // const dx = Math.abs(e.clientX - startPos.current.x);
        // const dy = Math.abs(e.clientY - startPos.current.y);

        // const isTap = dx < 5 && dy < 5;
        // if (!isTap) return;

        const isSameTrack = currentTrack?.id === track.id;

        if (isSameTrack) {
          onPlay(track, { preview: false, toggle: true });
        } else {
          onPlay(track, { preview: false });
        }
      }}
    >
      <div className={styles.left}>
        <div
          
          className={styles.dragHandle}
          //onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.albumWrapper}
            //    onPointerDown={(e) => {
            //     e.stopPropagation();}}
          >
            <img
              src={track.imageUrl}
              alt={`${track.name} cover`}
              className={styles.albumImage}
            />

            {!isHoverDevice && (
              <div className={styles.overlay}>
                {currentTrack?.id === track.id && isPlaying ? "⏸" : "▶️"}
              </div>
            )}
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
          width: isCurrentPlaying ? "180px" : "0px",
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