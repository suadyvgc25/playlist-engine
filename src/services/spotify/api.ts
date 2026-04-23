import { requireAccessToken } from "./auth";

const SPOTIFY_BASE_URL = "https://api.spotify.com/v1";
const SPOTIFY_RETRYABLE_STATUSES = new Set([502, 503, 504]);
const SPOTIFY_RETRY_DELAYS_MS = [250, 750];

export class SpotifyApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function spotifyFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await requireAccessToken();
  const method = (options.method ?? "GET").toUpperCase();
  const canRetry = method === "GET" || method === "HEAD";
  let res: Response | null = null;
  let lastError: unknown;

  for (let attempt = 0; attempt <= SPOTIFY_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      res = await fetch(`${SPOTIFY_BASE_URL}${path}`, {
        method,
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        },
      });
    } catch (error) {
      lastError = error;

      if (!canRetry || attempt === SPOTIFY_RETRY_DELAYS_MS.length) {
        throw error;
      }

      await delay(SPOTIFY_RETRY_DELAYS_MS[attempt]);
      continue;
    }

    if (
      res.ok ||
      !canRetry ||
      !SPOTIFY_RETRYABLE_STATUSES.has(res.status) ||
      attempt === SPOTIFY_RETRY_DELAYS_MS.length
    ) {
      break;
    }

    await delay(SPOTIFY_RETRY_DELAYS_MS[attempt]);
  }

  if (!res) {
    throw lastError instanceof Error ? lastError : new Error("Spotify request failed.");
  }

  // Preserve Spotify's retry hint so callers can show a useful wait message.
  if (res.status === 429) {
    const retryAfter = res.headers.get("Retry-After");
    const retryAfterSeconds = retryAfter ? Number(retryAfter) : undefined;

    throw new SpotifyApiError(
      `Rate limited by Spotify. Retry after ${retryAfter ?? "a bit"} seconds.`,
      429,
      { retryAfterSeconds }
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
        : SPOTIFY_RETRYABLE_STATUSES.has(res.status)
        ? "Spotify is temporarily unavailable. Please try again."
        : `Spotify API error (${res.status}).`;

    throw new SpotifyApiError(message, res.status, data);
  }

  return data as T;
}
