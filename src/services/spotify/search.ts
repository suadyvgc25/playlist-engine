import { spotifyFetch } from "./api";
import { mapSpotifyTrackToTrack } from "./mappers";
import type { Track } from "../../types/track";

type SpotifySearchResponse = {
  tracks?: {
    items: any[];
  };
};

type ITunesSearchResult = {
  kind?: string;
  trackName?: string;
  artistName?: string;
  previewUrl?: string;
};

type ITunesSearchResponse = {
  results?: ITunesSearchResult[];
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

  try {
    const results = await loadITunesResults(query);
    console.log("iTunes results:", results);
    // 🎯 Find best match
    const match = results.find((item) => {
      const isMusic = item.kind === "song";

      const nameMatch = item.trackName?.toLowerCase().includes(track.name.toLowerCase());
      const artistMatch = item.artistName?.toLowerCase().includes(track.artist.split(",")[0].toLowerCase());

      return isMusic && nameMatch && artistMatch && item.previewUrl;
    });

    return match?.previewUrl ?? undefined;
  } catch (err) {
    console.warn("Failed to fetch iTunes preview", err);
    return undefined;
  }
}

function loadITunesResults(query: string): Promise<ITunesSearchResult[]> {
  const params = new URLSearchParams({
    term: query,
    limit: "5",
    media: "music",
    entity: "song",
    country: "US",
  });

  return fetch(`/api/itunes/search?${params.toString()}`)
    .then((res) => (res.ok ? res.json() : { results: [] }))
    .then((data: ITunesSearchResponse) => data.results ?? [])
    .catch(() => []);
}
