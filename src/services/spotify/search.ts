import { spotifyFetch } from "./api";
import { mapSpotifyTrackToTrack } from "./mappers";
import type { Track } from "../../types/track";
import type { SpotifyTrackItem } from "./types";

type SpotifySearchResponse = {
  tracks?: {
    items: SpotifyTrackItem[];
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
  const tracks = items.map(mapSpotifyTrackToTrack);

  return Promise.all(
    tracks.map(async (track) => {
      if (track.previewUrl) return track;

      const previewUrl = await fetchPreviewFromiTunes(track);
      return previewUrl ? { ...track, previewUrl } : track;
    })
  );
}

export async function fetchPreviewFromiTunes(track: Track): Promise<string | undefined> {
  const query = `${track.name} ${track.artist}`;

  try {
    const results = await loadITunesResults(query);
    // Spotify tracks can map to broad iTunes results; use the title and lead artist to avoid unrelated previews.
    const trackName = normalizeSearchText(track.name);
    const leadArtist = normalizeSearchText(track.artist.split(",")[0]);

    const match = results.find((item) => {
      const isMusic = item.kind === "song";
      const resultName = normalizeSearchText(item.trackName ?? "");
      const resultArtist = normalizeSearchText(item.artistName ?? "");

      const nameMatch =
        resultName.includes(trackName) ||
        trackName.includes(resultName);
      const artistMatch =
        resultArtist.includes(leadArtist) ||
        leadArtist.includes(resultArtist);

      return isMusic && nameMatch && artistMatch && item.previewUrl;
    });

    return match?.previewUrl ?? results.find((item) => item.kind === "song" && item.previewUrl)?.previewUrl;
  } catch (err) {
    console.warn("Failed to fetch iTunes preview", err);
    return undefined;
  }
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function loadITunesResults(query: string): Promise<ITunesSearchResult[]> {
  const params = new URLSearchParams({
    term: query,
    limit: "5",
    media: "music",
    entity: "song",
    country: "US",
  });

  const searchUrl = import.meta.env.DEV
    ? `/api/itunes/search?${params.toString()}`
    : `https://itunes.apple.com/search?${params.toString()}`;

  return fetch(searchUrl)
    .then((res) => (res.ok ? res.json() : { results: [] }))
    .then((data: ITunesSearchResponse) => data.results ?? [])
    .catch(() => []);
}
