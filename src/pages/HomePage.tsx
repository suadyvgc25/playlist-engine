import { useEffect, useState } from "react";
import type { Track } from "../types/track";
import type { SpotifyCurrentUser } from "../services/spotify/users";

import { getCurrentUserProfile } from "../services/spotify/users";
import { searchTracks } from "../services/spotify/search";
import { logout, getStoredTokens } from "../services/spotify/auth";
import { savePlaylistToSpotify } from "../services/spotify/savePlaylist";

import LoginHero from "../components/LoginHero/LoginHero";
import AuthButton from "../components/AuthButton/AuthButton";
import Header from "../components/Header/Header";
import SearchBar from "../components/SearchBar/SearchBar";
import SearchResults from "../components/SearchResults/SearchResults";
import Playlist from "../components/Playlist/Playlist";

import styles from "../App.module.scss";

export default function HomePage() {
  const tokens = getStoredTokens();
  const isLoggedIn = !!tokens;

  if (!isLoggedIn) {
    return <LoginHero />;
  }

  const [user, setUser] = useState<SpotifyCurrentUser | null>(null);

  const [playlistName, setPlaylistName] = useState("My Playlist");
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      if (!tokens) return;
      try {
        const profile = await getCurrentUserProfile();
        setUser(profile);
      } catch (err) {
        console.error("Failed to load user", err);
      }
    }
    loadUser();
  }, []);

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

  async function handleSavePlaylist() {
    try {
      setSaving(true);
      setSaveError(null);

      const playlist = await savePlaylistToSpotify(playlistName, playlistTracks);
      console.log("Open playlist here:", playlist.external_urls?.spotify);
      setSaveSuccess(`Playlist saved: ${playlist.name}`);

    } catch (e: any) {
      setSaveError(e?.message ?? "Failed to save playlist");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    window.location.reload();
  }

  const resultsCount = results.length;
  const playlistCount = playlistTracks.length;

  const showNoResults =
    !loading && !error && results.length === 0 && query.trim() !== "";

  return (
    <div className={styles.appShell}>
      <Header 
        isLoggedIn={isLoggedIn} 
        userName={user?.display_name} 
        onLogout={handleLogout}
      />
      <main className={styles.main}>
        <section className={styles.leftCol} aria-label="Search and results">
          <h2 className={styles.sectionTitle}>Browse Music</h2>

          {isLoggedIn && (
            <>

              <SearchBar
                query={query}
                onQueryChange={setQuery}
                onSearch={onSearch}
                loading={loading}
              />

              {error && <p style={{ marginTop: 12 }}>❌ {error}</p>}

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

          {saveSuccess && <p style={{ color: "green" }}>{saveSuccess}</p>}
          {saveError && <p style={{ color: "red" }}>{saveError}</p>}

          <Playlist
            name={playlistName}
            tracks={playlistTracks}
            onNameChange={handlePlaylistNameChange}
            onRemove={removeTrack}
            onClear={clearPlaylist}
            onSave={handleSavePlaylist}
            playlistCount={playlistCount}
            saving={saving}
          />
        </section>
      </main>
    </div>
  );
}