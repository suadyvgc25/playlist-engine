import { useState } from "react";
import type { Track } from "./types/track";
import Header from "./components/Header/Header";
import SearchBar from "./components/SearchBar/SearchBar";
import SearchResults from "./components/SearchResults/SearchResults";
import Playlist from "./components/Playlist/Playlist";
import styles from "./App.module.scss";

const mockTracks: Track[] = [
  { id: "1", name: "Blinding Lights", artist: "The Weeknd" },
  { id: "2", name: "Levitating", artist: "Dua Lipa" },
  { id: "3", name: "Watermelon Sugar", artist: "Harry Styles" },
];

export default function App() {
  const [playlistName, setPlaylistName] = useState("My Playlist");
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  
  function addTrack(track: Track) {
    setPlaylistTracks((prev) => {
      const alreadyAdded = prev.some((t) => t.id === track.id);
      if (alreadyAdded) return prev;
      return [...prev, track];
    });
  }

  function removeTrack(trackId: string) {
    setPlaylistTracks((prev) =>
      prev.filter((t) => t.id !== trackId)
    );
  }

  function handlePlaylistNameChange(value: string) {
    setPlaylistName(value);
  }

  function clearPlaylist() {
    setPlaylistTracks([]);
  }

  const resultsCount = mockTracks.length;
  const playlistCount = playlistTracks.length;

  return (
    <div className={styles.appShell}>
      <Header />

      <main className={styles.main}>
        <section className={styles.leftCol} aria-label="Search and results">
          <h2 className={styles.sectionTitle}>Browse Music</h2>
          <SearchBar />
          <SearchResults
            tracks={mockTracks}
            onAdd={addTrack}
            resultsCount={resultsCount}
          />
        </section>

        <section className={styles.rightCol} aria-label="Playlist builder">
          <h2 className={styles.sectionTitle}>Playlist Builder</h2>
          <Playlist
            name={playlistName}
            tracks={playlistTracks}
            onNameChange={handlePlaylistNameChange}
            onRemove={removeTrack}
            onClear={clearPlaylist}
            playlistCount={playlistCount}
          />
        </section>
      </main>
    </div>
  );
}