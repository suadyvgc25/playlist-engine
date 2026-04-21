import { createPlaylist, addTracksToPlaylist } from "./playlist";
import type { Track } from "../../types/track";

export async function savePlaylistToSpotify(
  playlistName: string,
  tracks: Track[]
) {
  const playlist = await createPlaylist({
    name: playlistName.trim(),
    description: "Created with Playlist Engine",
    public: false,
  });

  const uris = tracks.map((track) => track.uri);

  if (uris.length > 0) {
    await addTracksToPlaylist(playlist.id, uris);
  }

  return playlist;
}
