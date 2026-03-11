import { spotifyFetch } from "./api";

export type SpotifyCurrentUser = {
  id: string;
  display_name?: string;
};

export async function getCurrentUserProfile(): Promise<SpotifyCurrentUser> {
  return spotifyFetch<SpotifyCurrentUser>("/me");
}