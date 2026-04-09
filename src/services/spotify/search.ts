import { spotifyFetch } from "./api";
import { mapSpotifyTrackToTrack } from "./mappers";
import type { Track } from "../../types/track";

type SpotifySearchResponse = {
  tracks?: {
    items: any[];
  };
};

export async function searchTracks(query: string): Promise<Track[]> {
  const q = query.trim();
  if (!q) return [];

  const params = new URLSearchParams({
    q,
    type: "track",
    limit: "10",
  });

  const data = await spotifyFetch<SpotifySearchResponse>(`/search?${params.toString()}`);
  const items = data.tracks?.items ?? [];
  return items.map(mapSpotifyTrackToTrack);
}

export async function fetchPreviewFromiTunes(track: Track): Promise<string | undefined> {
  const query = `${track.name} ${track.artist}`;
  
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=5&media=music&entity=song`
  );

  const data = await res.json();

  const results = data.results || [];
  console.log("iTunes results:", results);
  // 🎯 Find best match
  const match = results.find((item: any) => {
  const isMusic = item.kind === "song";

  const nameMatch = item.trackName?.toLowerCase().includes(track.name.toLowerCase());
  const artistMatch = item.artistName?.toLowerCase().includes(track.artist.split(",")[0].toLowerCase());

  return isMusic && nameMatch && artistMatch && item.previewUrl;
});

  return match?.previewUrl ?? undefined;
}