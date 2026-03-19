import styles from "./Playlist.module.scss";
import type { Track } from "../../types/track";
import { formatDuration } from "../../utils/formatDuration";
import { formatPlaylistDuration } from "../../utils/formatPlaylistDuration";

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

  const totalDuration = tracks.reduce(
    (sum, track) => sum + track.duration, 0
  );

  const playlistDuration = formatPlaylistDuration(totalDuration);

  return (
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

      <ul className={styles.trackList}>
        {tracks.map((track) => (
          <li key={track.id} className={styles.trackItem}>
            <img 
              src={track.imageUrl} 
              alt={`${track.name} cover`} 
              className={styles.albumImage} 
            />
            <div className={styles.trackInfo}>
              <p className={styles.trackName}>{track.name}</p>
              <p className={styles.artistName}>{track.artist}</p>
            </div>
            <div className={styles.trackActions}>
              <p className={styles.trackDuration}>{formatDuration(track.duration)}</p>
              <button
                className={styles.removeButton}
                onClick={() => onRemove(track.id)}
              >
                Remove
              </button>
            </div>
            
          </li>
        ))}
      </ul>

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
  );
}