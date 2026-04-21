import { SpotifyApiError, spotifyFetch } from "./api";

export type SpotifyCurrentUser = {
  id: string;
  display_name?: string | null;
  email?: string | null;
};

let currentUserProfilePromise: Promise<SpotifyCurrentUser> | null = null;
let profileRetryAfter = 0;

export async function getCurrentUserProfile(): Promise<SpotifyCurrentUser> {
  if (Date.now() < profileRetryAfter) {
    throw new SpotifyApiError("Spotify profile is temporarily rate limited.", 429, {
      retryAfterSeconds: Math.ceil((profileRetryAfter - Date.now()) / 1000),
    });
  }

  currentUserProfilePromise ??= spotifyFetch<SpotifyCurrentUser>("/me").catch((error) => {
    currentUserProfilePromise = null;
    if (error instanceof SpotifyApiError && error.status === 429) {
      const retryAfterSeconds =
        typeof error.details === "object" &&
        error.details !== null &&
        "retryAfterSeconds" in error.details &&
        typeof error.details.retryAfterSeconds === "number"
          ? error.details.retryAfterSeconds
          : 60;

      profileRetryAfter = Date.now() + retryAfterSeconds * 1000;
    }
    throw error;
  });

  return currentUserProfilePromise;
}
