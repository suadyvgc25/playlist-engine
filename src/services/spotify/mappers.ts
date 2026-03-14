import type { Track } from "../../types/track";

export function mapSpotifyTrackToTrack(item: any): Track {
  return {
    id: item.id,
    name: item.name,
    artist: item.artists?.map((a: any) => a.name).join(", ") ?? "Unknown",
    album: item.album?.name ?? "Unknown",
    imageUrl: item.album?.images?.[0]?.url ?? "", 
    uri: item.uri,
    duration: item.duration_ms,
  };
}