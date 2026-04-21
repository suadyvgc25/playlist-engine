import type { Track } from "../../types/track";
import type { SpotifyTrackItem } from "./types";

export function mapSpotifyTrackToTrack(item: SpotifyTrackItem): Track {
  return {
    id: item.id,
    name: item.name,
    artist: item.artists?.map((artist) => artist.name).join(", ") ?? "Unknown",
    album: item.album?.name ?? "Unknown",
    imageUrl: item.album?.images?.[0]?.url ?? "",
    uri: item.uri,
    duration: item.duration_ms,
    previewUrl: item.preview_url,
  };
}
