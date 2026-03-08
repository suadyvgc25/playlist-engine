import { requireAccessToken } from "./auth";

const SPOTIFY_BASE_URL = "https://api.spotify.com/v1";

export class SpotifyApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
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
  console.log("Access token from storage:", token);
  const res = await fetch(`${SPOTIFY_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  // Handle rate limit 429)
  if (res.status === 429) {
    const retryAfter = res.headers.get("Retry-After");
    throw new SpotifyApiError(
      `Rate limited by Spotify. Retry after ${retryAfter ?? "a bit"} seconds.`,
      429
    );
  }

  let data: any = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }

  if (!res.ok) {
    console.error("Spotify error status:", res.status);
    console.error("Spotify error body:", data);
    // 401 means token invalid/expired
    const message =
      res.status === 401
        ? "Unauthorized (token expired). Please log in again."
        : `Spotify API error (${res.status}).`;

    throw new SpotifyApiError(message, res.status, data);
    // throw new SpotifyApiError(
    //   data?.error?.message || `Spotify API error (${res.status})`,
    //   res.status,
    //   data
    // );
  }

  return data as T;
}