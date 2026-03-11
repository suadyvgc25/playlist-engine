import { spotifyFetch } from "./api";

export type CreatedPlaylist = {
  id: string;
  name: string;
  external_urls?: {
    spotify?: string;
  };
};

type CreatePlaylistBody = {
  name: string;
  description?: string;
  public?: boolean;
};

type AddItemsResponse = {
  snapshot_id: string;
};

export async function createPlaylist(
  body: CreatePlaylistBody
): Promise<CreatedPlaylist> {
  return spotifyFetch<CreatedPlaylist>(`/me/playlists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function addTracksToPlaylist(
  playlistId: string,
  uris: string[]
): Promise<AddItemsResponse> {
  return spotifyFetch<AddItemsResponse>(`/playlists/${playlistId}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris }),
  });
}