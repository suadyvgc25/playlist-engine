import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./Playlist.module.scss";
import type { Track } from "../../types/track";
import { formatDuration } from "../../utils/formatDuration";

type Props = {
  track: Track;
  onRemove?: (id: string) => void;
  showDragHandle?: boolean;
};

export default function SortableTrackItem({ track, onRemove, showDragHandle = true, }: Props) {
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

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isOverlay ? {} : attributes)}
      className={styles.trackItem}
    >

      {showDragHandle && (
        <div {...(isOverlay ? {} : listeners)} className={styles.dragHandle}>
          ⠿
        </div>
      )}

      <img
        src={track.imageUrl}
        alt={track.name}
        className={styles.albumImage}
      />

      <div className={styles.trackInfo}>
        <p className={styles.trackName}>{track.name}</p>
        <p className={styles.artistName}>{track.artist}</p>
      </div>

      <div className={styles.trackActions}>
        <p className={styles.trackDuration}>
          {formatDuration(track.duration)}
        </p>
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
      
    </li>
  );
}