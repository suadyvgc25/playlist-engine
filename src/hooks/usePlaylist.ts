import { useState } from "react";
import { savePlaylistToSpotify } from "../services/spotify/savePlaylist";
import type { Track } from "../types/track";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function usePlaylist() {
  const [playlistName, setPlaylistName] = useState("My Playlist");
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  function addTrack(track: Track) {
    setPlaylistTracks((prev) => {
      const alreadyAdded = prev.some((t) => t.id === track.id);
      if (alreadyAdded) return prev;
      return [...prev, track];
    });
  }

  function removeTrack(trackId: string) {
    setPlaylistTracks((prev) => prev.filter((track) => track.id !== trackId));
  }

  function clearPlaylist() {
    setPlaylistTracks([]);
  }

  async function savePlaylist() {
    try {
      setSaving(true);
      setSaveError(null);

      const playlist = await savePlaylistToSpotify(playlistName, playlistTracks);
      setSaveSuccess(`Playlist Saved: ${playlist.name}`);
    } catch (error) {
      setSaveError(getErrorMessage(error, "Failed to save playlist"));
    } finally {
      setSaving(false);
    }
  }

  return {
    playlistName,
    setPlaylistName,
    playlistTracks,
    setPlaylistTracks,
    saving,
    saveError,
    saveSuccess,
    addTrack,
    removeTrack,
    clearPlaylist,
    savePlaylist,
  };
}
