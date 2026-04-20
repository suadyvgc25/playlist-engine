import { useEffect, useState, useRef } from "react";
import type { Track } from "../types/track";
import type { SpotifyCurrentUser } from "../services/spotify/users";

import { getCurrentUserProfile } from "../services/spotify/users";
import { searchTracks } from "../services/spotify/search";
import { logout, getStoredTokens } from "../services/spotify/auth";
import { savePlaylistToSpotify } from "../services/spotify/savePlaylist";
import { fetchPreviewFromiTunes } from "../services/spotify/search";

import { DndContext, DragEndEvent, DragOverlay, closestCorners } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { formatDuration } from "../utils/formatDuration"; 
import SortableTrackItem from "../components/Playlist/SortableTrackItem";

import LoginHero from "../components/LoginHero/LoginHero";
import AuthButton from "../components/AuthButton/AuthButton";
import Header from "../components/Header/Header";
import SearchBar from "../components/SearchBar/SearchBar";
import SearchResults from "../components/SearchResults/SearchResults";
import Playlist from "../components/Playlist/Playlist";

import styles from "../App.module.scss";

const DRAG_THRESHOLD = 5;
type PlaybackSource = "search" | "playlist";

type PlayTrackOptions = {
  preview?: boolean;
  toggle?: boolean;
  source?: PlaybackSource;
  queueIndex?: number;
};

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
  const [mobileView, setMobileView] = useState<"results" | "playlist">("results");

  const [activeTrack, setActiveTrack] = useState<Track | null>(null);

  const [activeTrackSource, setActiveTrackSource] = useState<"search" | "playlist" | null>(null);
  const [activeOverlaySize, setActiveOverlaySize] = useState<{ width: number; height: number } | null>(null);

  // Player State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHoverPreview, setIsHoverPreview] = useState(false);
  const [tracksWithoutPreviews, setTracksWithoutPreviews] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hoverTrackIdRef = useRef<string | null>(null);
  const playbackSourceRef = useRef<PlaybackSource>("search");
  const playbackIndexRef = useRef(-1);

  if (!audioRef.current) {
    audioRef.current = new Audio();
  }

  const audio = audioRef.current;

  function clearAudio(audio: HTMLAudioElement) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  }

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

  useEffect(() => {
    if (!audio) return;

    audio.ontimeupdate = () => {
      setProgress(audio.currentTime);
    };

    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
    };

    audio.onended = () => {
      setIsPlaying(false);
    };
  }, [audio]);

  async function onSearch() {
    if (!query.trim()) return;

    setError(null);
    setLoading(true);
    setMobileView("results");

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
    setTracksWithoutPreviews((prev) => {
      const next = new Set(prev);
      next.delete(trackId);
      return next;
    });
  }

  function handlePlaylistNameChange(value: string) {
    setPlaylistName(value);
  }

  function clearPlaylist() {
    setPlaylistTracks([]);
    setTracksWithoutPreviews(new Set());
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

  function handleDragStart(event: any) {
    const activeId = event.active.id.toString();

    // ✅ Case 1: Dragging from search results
    if (activeId.startsWith("search-")) {
      const trackId = activeId.replace("search-", "");
      const sourceRow = document.querySelector<HTMLElement>(
        `[data-search-track-id="${trackId}"]`
      );
      const sourceRect = sourceRow?.getBoundingClientRect();
      const track = event.active.data.current;

      setActiveOverlaySize(
        sourceRect
          ? { width: sourceRect.width, height: sourceRect.height }
          : null
      );
      setActiveTrack(track ?? null);
      setActiveTrackSource("search");
      return;
    }

    // ✅ Case 2: Dragging from playlist (sortable)
    if (activeId.startsWith("playlist-")) {
      const activeRect = event.active.rect.current?.initial;
      const trackId = activeId.replace("playlist-", "");

      const track = playlistTracks.find((t) => t.id === trackId);

      setActiveOverlaySize(
        activeRect
          ? { width: activeRect.width, height: activeRect.height }
          : null
      );
      setActiveTrack(track ?? null);
      setActiveTrackSource("playlist");
      return;
    }

    // ✅ Fallback (should not happen)
    setActiveTrack(null);
    setActiveTrackSource(null);
    setActiveOverlaySize(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over, delta } = event;
    const trackId = active.id.toString().replace("search-", "");
    
    if (Math.abs(delta.x) < DRAG_THRESHOLD && Math.abs(delta.y) < DRAG_THRESHOLD) {
      setActiveTrack(null);
      setActiveTrackSource(null);
      setActiveOverlaySize(null);
      return;
    }
    
    if (!over) {
      setActiveTrack(null);
      setActiveTrackSource(null);
      setActiveOverlaySize(null);
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    const isFromSearch = activeId.startsWith("search-");
    const isFromPlaylist = activeId.startsWith("playlist-");
 
    // CASE 1: Dropping from search into playlist
    if (
      isFromSearch && 
      ( 
        over?.id === "playlist-dropzone" || overId.startsWith("playlist-")
      )
    ){
      const track = active.data.current as Track;
      addTrack(track);
      setActiveTrack(null);
      setActiveTrackSource(null);
      setActiveOverlaySize(null);
      return;
    }

    // CASE 2: Reordering within playlist
    if (isFromPlaylist) {
      setPlaylistTracks((prev) => {
        const oldIndex = prev.findIndex(
          (t) => `playlist-${t.id}` === active.id
        );

        if (oldIndex === -1) return prev;

        let newIndex;

        if (over.id.toString().startsWith("playlist-")) {
          newIndex = prev.findIndex(
            (t) => `playlist-${t.id}` === over.id
          );
        } else {
          newIndex = prev.length - 1;
        }

        if (newIndex === -1) return prev;

        return arrayMove(prev, oldIndex, newIndex);
      });
    }

    setActiveTrack(null);
    setActiveTrackSource(null);
    setActiveOverlaySize(null);
  }

  async function playTrack(track: Track, {
    preview = false,
    toggle = false,
    source,
    queueIndex,
  }: PlayTrackOptions = {}) {
    console.log("TRACK CLICKED:", track);
    // HANDLE MODE CLEANLY (THIS FIXES EVERYTHING)
    if (preview) {
      setIsHoverPreview(true);
    } else {
      setIsHoverPreview(false);
      hoverTrackIdRef.current = null;
    }

    if (!audioRef.current) return false;
    const audio = audioRef.current;

    const isSameTrack = currentTrack?.id === track.id;

    // HANDLE TOGGLE FIRST 
    if (toggle && isSameTrack) {
      if (!track.previewUrl && !audio.currentSrc) {
        clearAudio(audio);
        setCurrentTrack(track);
        return false;
      }

      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().catch(console.error);
        setIsPlaying(true);
      }
      return true; // prevents restart bug
    }

    // Track hover session
    if (preview) {
      hoverTrackIdRef.current = track.id;
    } else {
      clearAudio(audio);
    }

    let previewUrl = track.previewUrl;

    // If Spotify doesn't have it → fetch from iTunes
    if (!previewUrl) {
      try {
        previewUrl = await fetchPreviewFromiTunes(track);
      } catch (err) {
        console.warn("Preview lookup failed", err);
        previewUrl = undefined;
      }
        // Cancel if hover changed
      if (preview && hoverTrackIdRef.current !== track.id) {
        console.log("Hover cancelled, not playing");
        return false;
      }
    }

    if (!previewUrl) {
      console.warn("No preview available");

      // Only update UI if user CLICKED (not hover)
      if (!preview) {
        clearAudio(audio);
        setTracksWithoutPreviews((prev) => new Set(prev).add(track.id));
      }
      return false;
    }

    // Stop previous audio before playing new
    audio.pause();

    audio.src = previewUrl;
    audio.currentTime = 0;

    audio.play().catch(console.error);

    setCurrentTrack({
      ...track,
      previewUrl
    });
    if (!preview) {
      const nextSource =
        source ?? (playlistTracks.some((playlistTrack) => playlistTrack.id === track.id) ? "playlist" : "search");
      const nextQueue = nextSource === "playlist" ? playlistTracks : results;
      const nextIndex =
        typeof queueIndex === "number"
          ? queueIndex
          : nextQueue.findIndex((queueTrack) => queueTrack.id === track.id);

      playbackSourceRef.current = nextSource;
      playbackIndexRef.current = nextIndex;
    }
    setTracksWithoutPreviews((prev) => {
      const next = new Set(prev);
      next.delete(track.id);
      return next;
    });
    setPlaylistTracks((prev) =>
      prev.map((playlistTrack) =>
        playlistTrack.id === track.id ? { ...playlistTrack, previewUrl } : playlistTrack
      )
    );
    setResults((prev) =>
      prev.map((resultTrack) =>
        resultTrack.id === track.id ? { ...resultTrack, previewUrl } : resultTrack
      )
    );

    setIsPlaying(true);

    if (preview) {
      setIsHoverPreview(true);
    } else {
      // STEP 2 — LOCK THE TRACK
      setIsHoverPreview(false);

      // STEP 3 — CLEAR HOVER SESSION
      hoverTrackIdRef.current = null; // Lock overrides hover
    }

    return true;
  }

  function stopPreview() {
    // DO NOT stop if track is locked
    if (!isHoverPreview) return;
    
    hoverTrackIdRef.current = null;

    if (!audioRef.current) return;

    audioRef.current.pause();
    setIsPlaying(false); 
  }

  function pauseTrack() {
    audio.pause();
    setIsPlaying(false);
  }

  function resumeTrack() {
    audio.play();
    setIsPlaying(true);
  }

  function seek(time: number) {
    audio.currentTime = time;
  }

  async function playNextTrack() {
    const playbackSource = playbackSourceRef.current;
    const playbackQueue = playbackSource === "playlist" ? playlistTracks : results;

    if (playbackQueue.length === 0) return;

    const currentIndex = playbackIndexRef.current >= 0
      ? playbackIndexRef.current
      : currentTrack
      ? playbackQueue.findIndex((track) => track.id === currentTrack.id)
      : -1;

    for (let offset = 1; offset <= playbackQueue.length; offset += 1) {
      const nextIndex = (currentIndex + offset) % playbackQueue.length;
      const nextTrack = playbackQueue[nextIndex];
      const didPlay = await playTrack(nextTrack, {
        preview: false,
        source: playbackSource,
        queueIndex: nextIndex,
      });
      if (didPlay) {
        return;
      }
    }
  }

  return (

    <DndContext 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >

      <div className={styles.appShell}>

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
              onPlay={(track, opts) => playTrack(track, { ...opts, source: "playlist" })}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              tracksWithoutPreviews={tracksWithoutPreviews}
            />
            
          </section>
        </main>

        {currentTrack && (
          <aside className={styles.miniPlayer} aria-label="Now playing">
            <div className={styles.miniPlayerTop}>
              <img
                src={currentTrack.imageUrl}
                alt={`${currentTrack.name} cover`}
                className={styles.miniPlayerImage}
              />
              <div className={styles.miniPlayerInfo}>
                <p className={styles.miniPlayerTrack}>{currentTrack.name}</p>
                <p className={styles.miniPlayerArtist}>{currentTrack.artist}</p>
              </div>
              <div className={styles.miniPlayerControls}>
                <button
                  type="button"
                  className={styles.miniPlayerButton}
                  onClick={() => playTrack(currentTrack, { preview: false, toggle: true })}
                  aria-label={isPlaying ? `Pause ${currentTrack.name}` : `Play ${currentTrack.name}`}
                >
                  {isPlaying ? "Pause" : "Play"}
                </button>
                <button
                  type="button"
                  className={styles.miniPlayerButton}
                  onClick={playNextTrack}
                  aria-label="Play next song"
                >
                  Next
                </button>
              </div>
            </div>
            {isPlaying && (
              <div className={styles.miniWaveform} aria-hidden="true">
                {Array.from({ length: 56 }).map((_, i) => (
                  <span key={i} style={{ animationDelay: `${i * 0.05}s` }} />
                ))}
              </div>
            )}
          </aside>
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
            onRemove={undefined as any}
            showDragHandle={activeTrackSource === "playlist"} 
          />
        ) : null}
      </DragOverlay>

    </DndContext>
  );
}
