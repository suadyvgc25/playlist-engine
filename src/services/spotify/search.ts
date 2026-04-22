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

type DeezerTrackResult = {
  title?: string;
  artist?: {
    name?: string;
  };
  preview?: string;
};

type DeezerSearchResponse = {
  data?: DeezerTrackResult[];
};

const DEEZER_SEARCH_URL = "https://api.deezer.com/search";

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

      const previewUrl = await fetchTrackPreview(track);
      return previewUrl ? { ...track, previewUrl } : track;
    })
  );
}

export async function fetchTrackPreview(track: Track): Promise<string | undefined> {
  const query = `${track.name} ${track.artist}`;

  try {
    const deezerPreviewUrl = await fetchPreviewFromDeezer(track);
    if (deezerPreviewUrl) {
      return deezerPreviewUrl;
    }

    if (!canUseITunesLookup()) {
      return undefined;
    }

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
    console.warn("Failed to fetch track preview", err);
    return undefined;
  }
}

async function fetchPreviewFromDeezer(track: Track): Promise<string | undefined> {
  const params = new URLSearchParams({
    q: `${track.name} ${track.artist}`,
    limit: "5",
  });

  try {
    const data = await fetch(`${DEEZER_SEARCH_URL}?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : { data: [] })) as DeezerSearchResponse;

    const trackName = normalizeSearchText(track.name);
    const leadArtist = normalizeSearchText(track.artist.split(",")[0]);
    const results = data.data ?? [];

    const match = results.find((item) => {
      const resultName = normalizeSearchText(item.title ?? "");
      const resultArtist = normalizeSearchText(item.artist?.name ?? "");
      const nameMatch =
        resultName.includes(trackName) ||
        trackName.includes(resultName);
      const artistMatch =
        resultArtist.includes(leadArtist) ||
        leadArtist.includes(resultArtist);

      return nameMatch && artistMatch && item.preview;
    });

    return match?.preview ?? results.find((item) => item.preview)?.preview;
  } catch (err) {
    console.warn("Failed to fetch Deezer preview", err);
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

  if (!import.meta.env.DEV) {
    return loadITunesResultsFromProxy(params);
  }

  return fetch(`/api/itunes/search?${params.toString()}`)
    .then((res) => (res.ok ? res.json() : { results: [] }))
    .then((data: ITunesSearchResponse) => data.results ?? [])
    .catch(() => []);
}

function canUseITunesLookup() {
  return import.meta.env.DEV || Boolean(import.meta.env.VITE_ITUNES_PROXY_URL);
}

function loadITunesResultsFromProxy(params: URLSearchParams): Promise<ITunesSearchResult[]> {
  const proxyUrl = import.meta.env.VITE_ITUNES_PROXY_URL as string | undefined;
  if (!proxyUrl) {
    return Promise.resolve([]);
  }

  const requestUrl = new URL(proxyUrl);
  params.forEach((value, key) => {
    requestUrl.searchParams.set(key, value);
  });

  return fetch(requestUrl.toString())
    .then((res) => (res.ok ? res.json() : { results: [] }))
    .then((data: ITunesSearchResponse) => data.results ?? [])
    .catch(() => []);
}
