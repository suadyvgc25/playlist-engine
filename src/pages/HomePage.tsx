import { useEffect, useState } from "react";
import type { Track } from "../types/track";
import type { SpotifyCurrentUser } from "../services/spotify/users";

import { getCurrentUserProfile } from "../services/spotify/users";
import { searchTracks } from "../services/spotify/search";
import { logout, getStoredTokens } from "../services/spotify/auth";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { formatDuration } from "../utils/formatDuration";
import SortableTrackItem from "../components/Playlist/SortableTrackItem";

import LoginHero from "../components/LoginHero/LoginHero";
import Header from "../components/Header/Header";
import SearchBar from "../components/SearchBar/SearchBar";
import SearchResults from "../components/SearchResults/SearchResults";
import Playlist from "../components/Playlist/Playlist";
import MiniPlayer from "../components/MiniPlayer/MiniPlayer";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { usePlaylist } from "../hooks/usePlaylist";
import type { PlaybackSource } from "../hooks/useAudioPlayer";

import styles from "../App.module.scss";

const DRAG_THRESHOLD = 5;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function HomePage() {
  const tokens = getStoredTokens();
  const isLoggedIn = !!tokens;

  if (!isLoggedIn) {
    return <LoginHero />;
  }

  const [user, setUser] = useState<SpotifyCurrentUser | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"results" | "playlist">("results");
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [activeTrackSource, setActiveTrackSource] = useState<PlaybackSource | null>(null);
  const [activeOverlaySize, setActiveOverlaySize] = useState<{ width: number; height: number } | null>(null);

  const {
    playlistName,
    setPlaylistName,
    playlistTracks,
    setPlaylistTracks,
    saving,
    saveError,
    saveSuccess,
    addTrack,
    removeTrack: removePlaylistTrack,
    clearPlaylist: clearPlaylistTracks,
    savePlaylist,
  } = usePlaylist();

  const {
    currentTrack,
    isPlaying,
    isHoverPreview,
    tracksWithoutPreviews,
    playTrack,
    stopPreview,
    playNextTrack,
    clearUnavailablePreview,
    clearUnavailablePreviews,
  } = useAudioPlayer({
    results,
    playlistTracks,
    setResults,
    setPlaylistTracks,
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    })
  );

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
  }, [tokens]);

  async function onSearch() {
    if (!query.trim()) return;

    setError(null);
    setLoading(true);
    setMobileView("results");

    try {
      const tracks = await searchTracks(query);
      setResults(tracks);
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong."));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function removeTrack(trackId: string) {
    removePlaylistTrack(trackId);
    clearUnavailablePreview(trackId);
  }

  function clearPlaylist() {
    clearPlaylistTracks();
    clearUnavailablePreviews();
  }

  function handleLogout() {
    logout();
    window.location.reload();
  }

  const resultsCount = results.length;
  const playlistCount = playlistTracks.length;

  function clearDragOverlay() {
    setActiveTrack(null);
    setActiveTrackSource(null);
    setActiveOverlaySize(null);
  }

  function handleDragStart(event: DragStartEvent) {
    const activeId = event.active.id.toString();

    if (activeId.startsWith("search-")) {
      const trackId = activeId.replace("search-", "");
      const sourceRow = document.querySelector<HTMLElement>(
        `[data-search-track-id="${trackId}"]`
      );
      const sourceRect = sourceRow?.getBoundingClientRect();
      const track = event.active.data.current as Track | undefined;

      setActiveOverlaySize(
        sourceRect
          ? { width: sourceRect.width, height: sourceRect.height }
          : null
      );
      setActiveTrack(track ?? null);
      setActiveTrackSource("search");
      return;
    }

    if (activeId.startsWith("playlist-")) {
      const activeRect = event.active.rect.current?.initial;
      const trackId = activeId.replace("playlist-", "");
      const track = playlistTracks.find((playlistTrack) => playlistTrack.id === trackId);

      setActiveOverlaySize(
        activeRect
          ? { width: activeRect.width, height: activeRect.height }
          : null
      );
      setActiveTrack(track ?? null);
      setActiveTrackSource("playlist");
      return;
    }

    clearDragOverlay();
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over, delta } = event;

    if (Math.abs(delta.x) < DRAG_THRESHOLD && Math.abs(delta.y) < DRAG_THRESHOLD) {
      clearDragOverlay();
      return;
    }

    if (!over) {
      clearDragOverlay();
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();
    const isFromSearch = activeId.startsWith("search-");
    const isFromPlaylist = activeId.startsWith("playlist-");

    if (
      isFromSearch &&
      (over.id === "playlist-dropzone" || overId.startsWith("playlist-"))
    ) {
      const track = active.data.current as Track;
      addTrack(track);
      clearDragOverlay();
      return;
    }

    if (isFromPlaylist) {
      setPlaylistTracks((prev) => {
        const oldIndex = prev.findIndex(
          (track) => `playlist-${track.id}` === active.id
        );

        if (oldIndex === -1) return prev;

        const newIndex = overId.startsWith("playlist-")
          ? prev.findIndex((track) => `playlist-${track.id}` === over.id)
          : prev.length - 1;

        if (newIndex === -1) return prev;

        return arrayMove(prev, oldIndex, newIndex);
      });
    }

    clearDragOverlay();
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={`${styles.appShell} ${currentTrack ? styles.hasMiniPlayer : ""}`}>
        <Header
          isLoggedIn={isLoggedIn}
          userName={user?.display_name}
          onLogout={handleLogout}
        />

        <main className={styles.main}>
          <div className={styles.mobileTabs} aria-label="Mobile playlist navigation">
            <button
              type="button"
              className={`${styles.mobileTabButton} ${mobileView === "results" ? styles.mobileTabButtonActive : ""}`}
              onClick={() => setMobileView("results")}
            >
              Results
            </button>
            <button
              type="button"
              className={`${styles.mobileTabButton} ${mobileView === "playlist" ? styles.mobileTabButtonActive : ""}`}
              onClick={() => setMobileView("playlist")}
            >
              Playlist ({playlistCount})
            </button>
          </div>

          <section
            className={`${styles.leftCol} ${mobileView === "results" ? styles.mobilePanelActive : styles.mobilePanelHidden}`}
            aria-label="Search and results"
          >
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
                  onPlay={(track, opts) => playTrack(track, { ...opts, source: "search" })}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  stopPreview={stopPreview}
                  isHoverPreview={isHoverPreview}
                  tracksWithoutPreviews={tracksWithoutPreviews}
                />
              </>
            )}
          </section>

          <section
            className={`${styles.rightCol} ${mobileView === "playlist" ? styles.mobilePanelActive : styles.mobilePanelHidden}`}
            aria-label="Playlist builder"
          >
            <h2 className={styles.sectionTitle}>Playlist Builder</h2>

            {saveSuccess && <p className={styles.saveSuccessMessage}>{saveSuccess}</p>}
            {saveError && <p style={{ color: "red" }}>{saveError}</p>}

            <Playlist
              name={playlistName}
              tracks={playlistTracks}
              onNameChange={setPlaylistName}
              onRemove={removeTrack}
              onClear={clearPlaylist}
              onSave={savePlaylist}
              playlistCount={playlistCount}
              saving={saving}
              onPlay={(track, opts) => playTrack(track, { ...opts, source: "playlist" })}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              tracksWithoutPreviews={tracksWithoutPreviews}
            />
          </section>
        </main>

        {currentTrack && (
          <MiniPlayer
            track={currentTrack}
            isPlaying={isPlaying}
            onToggle={() => playTrack(currentTrack, { preview: false, toggle: true })}
            onNext={playNextTrack}
          />
        )}
      </div>

      <DragOverlay>
        {activeTrack && activeTrackSource === "search" ? (
          <div
            className={styles.dragOverlayCard}
            style={
              activeOverlaySize
                ? {
                    width: activeOverlaySize.width,
                    height: activeOverlaySize.height,
                  }
                : undefined
            }
          >
            <img
              src={activeTrack.imageUrl}
              alt={`${activeTrack.name} cover`}
              className={styles.overlayImage}
            />
            <div className={styles.overlayInfo}>
              <p className={styles.overlayTitle}>{activeTrack.name}</p>
              <p className={styles.overlayArtist}>{activeTrack.artist}</p>
            </div>
            <span className={styles.overlayDuration}>
              {formatDuration(activeTrack.duration)}
            </span>
            <button type="button" className={styles.overlayAddButton}>
              + Add
            </button>
          </div>
        ) : activeTrack ? (
          <SortableTrackItem
            track={activeTrack}
            showDragHandle={activeTrackSource === "playlist"}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
