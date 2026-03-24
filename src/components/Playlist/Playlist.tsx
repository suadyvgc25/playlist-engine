import styles from "./Playlist.module.scss";
import type { Track } from "../../types/track";
import { formatPlaylistDuration } from "../../utils/formatPlaylistDuration";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy} from "@dnd-kit/sortable";
import SortableTrackItem from "./SortableTrackItem";

type Props = {
  name: string;
  tracks: Track[];
  onNameChange: (value: string) => void;
  onRemove: (trackId: string) => void;
  onClear: () => void;
  onSave: () => void;
  playlistCount: number;
  saving: boolean;
};

export default function Playlist({
  name,
  tracks,
  onNameChange,
  onRemove,
  onClear,
  onSave,
  playlistCount,
  saving,
}: Props) {

  const { setNodeRef:setDroppableRef } = useDroppable({
    id: "playlist-dropzone",
  });
  const totalDuration = tracks.reduce(
    (sum, track) => sum + track.duration, 0
  );

  const playlistDuration = formatPlaylistDuration(totalDuration);

  return (
    <div
        ref={setDroppableRef}
        className={styles.playlistWrapper}
    >
      <div className={styles.playlist}>
        <div className={styles.headerRow}>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className={styles.titleInput}
          />
          <div className={styles.count}>
            {playlistCount} {playlistCount === 1 ? "song" : "songs"} • {playlistDuration}
          </div>
        </div>

        <SortableContext
          items={tracks.map((t) => `playlist-${t.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <ul className={styles.trackList}>
            {tracks.map((track) => (
              <SortableTrackItem
                key={`playlist-${track.id}`}
                track={track}
                onRemove={onRemove}
              />
            ))}
          </ul>
        </SortableContext>

        <div className={styles.actions}>
          <button className={styles.clearButton} onClick={onClear}>Clear All</button>
          <button className={styles.saveButton} onClick={onSave} disabled={tracks.length === 0 || saving}>
            <img
                  src="/spotify-white.svg"
                  alt="Spotify"
                  className={styles.icon}
            />
            {saving ? "Saving..." : "Save Playlist"}
          </button>
        </div>
        
      </div>
    </div>
  );
}