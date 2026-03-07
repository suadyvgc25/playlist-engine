import { useState } from "react";
import type { Track } from "../types/track";

import { searchTracks } from "../services/spotify/search";
import { getStoredTokens } from "../services/spotify/auth";

import AuthButton from "../components/AuthButton/AuthButton";
import Header from "../components/Header/Header";
import SearchBar from "../components/SearchBar/SearchBar";
import SearchResults from "../components/SearchResults/SearchResults";
import Playlist from "../components/Playlist/Playlist";

import styles from "../App.module.scss";

export default function HomePage() {
  const tokens = getStoredTokens();
  const isLoggedIn = !!tokens;

  const [playlistName, setPlaylistName] = useState("My Playlist");
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSearch() {
    if (!query.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const tracks = await searchTracks(query);
      setResults(tracks);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function addTrack(track: Track) {
    setPlaylistTracks((prev) => {
      const alreadyAdded = prev.some((t) => t.id === track.id);
      if (alreadyAdded) return prev;
      return [...prev, track];
    });
  }

  function removeTrack(trackId: string) {
    setPlaylistTracks((prev) => prev.filter((t) => t.id !== trackId));
  }

  function handlePlaylistNameChange(value: string) {
    setPlaylistName(value);
  }

  function clearPlaylist() {
    setPlaylistTracks([]);
  }

  const resultsCount = results.length;
  const playlistCount = playlistTracks.length;

  const showNoResults =
    !loading && !error && results.length === 0 && query.trim() !== "";

  return (
    <div className={styles.appShell}>
      <Header isLoggedIn={isLoggedIn} />

      <main className={styles.main}>
        <section className={styles.leftCol} aria-label="Search and results">
          <h2 className={styles.sectionTitle}>Browse Music</h2>

          {!isLoggedIn && (
            <div style={{ marginBottom: 20 }}>
              <AuthButton />
              <p style={{ marginTop: 8 }}>❌ Not logged in</p>
            </div>
          )}

          {isLoggedIn && (
            <>
              <p style={{ marginBottom: 12 }}>✅ Logged in to Spotify</p>

              <SearchBar
                query={query}
                onQueryChange={setQuery}
                onSearch={onSearch}
                loading={loading}
              />

              {error && <p style={{ marginTop: 12 }}>❌ {error}</p>}

              {showNoResults && (
                <p style={{ marginTop: 12 }}>No results.</p>
              )}

              <SearchResults
                 tracks={results}
                 onAdd={addTrack}
                 resultsCount={resultsCount}
                 loading={loading}
                 error={error}
                 query={query}
              />
            </>
          )}
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