import type { Track } from "../../types/track";
import styles from "../../App.module.scss";

type Props = {
  track: Track;
  isPlaying: boolean;
  onToggle: () => void;
  onNext: () => void;
};

const WAVE_BAR_COUNT = 180;

export default function MiniPlayer({ track, isPlaying, onToggle, onNext }: Props) {
  return (
    <aside
      className={`${styles.miniPlayer} ${isPlaying ? styles.miniPlayerPlaying : ""}`}
      aria-label="Now playing"
    >
      <div className={styles.miniPlayerTop}>
        <img
          src={track.imageUrl}
          alt={`${track.name} cover`}
          className={styles.miniPlayerImage}
        />
        <div className={styles.miniPlayerInfo}>
          <p className={styles.miniPlayerTrack}>{track.name}</p>
          <p className={styles.miniPlayerArtist}>{track.artist}</p>
        </div>
        <div className={styles.miniPlayerControls}>
          <button
            type="button"
            className={styles.miniPlayerButton}
            onClick={onToggle}
            aria-label={isPlaying ? `Pause ${track.name}` : `Play ${track.name}`}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            className={styles.miniPlayerButton}
            onClick={onNext}
            aria-label="Play next song"
          >
            Next
          </button>
        </div>
      </div>
      {isPlaying && (
        <div className={styles.miniWaveform} aria-hidden="true">
          {Array.from({ length: WAVE_BAR_COUNT }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
      )}
    </aside>
  );
}
