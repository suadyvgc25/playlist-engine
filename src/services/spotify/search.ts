import { spotifyFetch } from "./api";
import { mapSpotifyTrackToTrack } from "./mappers";
import type { Track } from "../../types/track";
import type { SpotifyTrackItem } from "./types";

type SpotifySearchResponse = {
  tracks?: {
    items: SpotifyTrackItem[];
  };
};

type SearchTracksOptions = {
  limit?: number;
  offset?: number;
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
export const DEFAULT_TRACK_SEARCH_LIMIT = 20;
export const MAX_TRACK_SEARCH_LIMIT = 50;
const SPOTIFY_SEARCH_PAGE_LIMIT = 10;

function normalizeTrackSearchLimit(limit: number) {
  if (!Number.isFinite(limit)) return DEFAULT_TRACK_SEARCH_LIMIT;

  return Math.min(Math.max(Math.trunc(limit), 1), MAX_TRACK_SEARCH_LIMIT);
}

export function getTrackDedupeKey(track: Track) {
  return `${normalizeSearchText(track.name)}:${normalizeSearchText(track.artist)}`;
}

function getSpotifyTrackDedupeKey(item: SpotifyTrackItem) {
  const artistNames = item.artists?.map((artist) => artist.name).join(", ") ?? "";

  return `${normalizeSearchText(item.name)}:${normalizeSearchText(artistNames)}`;
}

export async function searchTracks(
  query: string,
  options: SearchTracksOptions = {}
): Promise<Track[]> {
  const q = query.trim();
  if (!q) return [];

  const requestedLimit = normalizeTrackSearchLimit(options.limit ?? DEFAULT_TRACK_SEARCH_LIMIT);
  const requestedOffset = Math.max(Math.trunc(options.offset ?? 0), 0);
  const pageRequests = Array.from(
    { length: Math.ceil(requestedLimit / SPOTIFY_SEARCH_PAGE_LIMIT) },
    (_, index) => {
      const pageOffset = requestedOffset + index * SPOTIFY_SEARCH_PAGE_LIMIT;
      const pageLimit = Math.min(
        SPOTIFY_SEARCH_PAGE_LIMIT,
        requestedLimit - index * SPOTIFY_SEARCH_PAGE_LIMIT
      );
      const params = new URLSearchParams({
        q,
        type: "track",
        limit: pageLimit.toString(),
        offset: pageOffset.toString(),
      });

      return spotifyFetch<SpotifySearchResponse>(`/search?${params.toString()}`);
    }
  );

  const pages = await Promise.all(pageRequests);
  const items = dedupeSpotifyTrackItems(
    pages.flatMap((data) => data.tracks?.items ?? [])
  ).slice(0, requestedLimit);
  const tracks = items.map(mapSpotifyTrackToTrack);

  return Promise.all(
    tracks.map(async (track) => {
      if (track.previewUrl) return track;

      const previewUrl = await fetchTrackPreview(track);
      return previewUrl ? { ...track, previewUrl } : track;
    })
  );
}

function dedupeSpotifyTrackItems(items: SpotifyTrackItem[]) {
  const seenIds = new Set<string>();
  const seenTrackKeys = new Set<string>();

  return items.filter((item) => {
    const trackKey = getSpotifyTrackDedupeKey(item);

    if (seenIds.has(item.id) || seenTrackKeys.has(trackKey)) return false;

    seenIds.add(item.id);
    seenTrackKeys.add(trackKey);
    return true;
  });
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
    const data = await loadDeezerResults(params);

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

function loadDeezerResults(params: URLSearchParams): Promise<DeezerSearchResponse> {
  if (typeof document === "undefined") {
    return Promise.resolve({ data: [] });
  }

  return new Promise((resolve) => {
    const callbackName = `playlistEngineDeezer_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;
    const script = document.createElement("script");
    const callbacks = window as typeof window &
      Record<string, (data: DeezerSearchResponse) => void>;

    function cleanup() {
      window.clearTimeout(timeoutId);
      script.remove();
      delete callbacks[callbackName];
    }

    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve({ data: [] });
    }, 7000);

    callbacks[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    params.set("output", "jsonp");
    params.set("callback", callbackName);
    script.async = true;
    script.src = `${DEEZER_SEARCH_URL}?${params.toString()}`;
    script.onerror = () => {
      cleanup();
      resolve({ data: [] });
    };

    document.head.append(script);
  });
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
