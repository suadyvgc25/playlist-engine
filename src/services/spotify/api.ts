import { requireAccessToken } from "./auth";

const SPOTIFY_BASE_URL = "https://api.spotify.com/v1";

export class SpotifyApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function spotifyFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {

  const token = await requireAccessToken();
  
  const res = await fetch(`${SPOTIFY_BASE_URL}${path}`, {
    method: "GET",
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  // Preserve Spotify's retry hint so callers can show a useful wait message.
  if (res.status === 429) {
    const retryAfter = res.headers.get("Retry-After");
    throw new SpotifyApiError(
      `Rate limited by Spotify. Retry after ${retryAfter ?? "a bit"} seconds.`,
      429
    );
  }

  let data: unknown = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }

  if (!res.ok) {
    // Treat unauthorized responses as a login problem instead of a generic API failure.
    const message =
      res.status === 401
        ? "Unauthorized (token expired). Please log in again."
        : `Spotify API error (${res.status}).`;

    throw new SpotifyApiError(message, res.status, data);
  }

  return data as T;
}
