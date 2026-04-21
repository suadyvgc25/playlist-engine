export type SpotifyImage = {
  url: string;
  height?: number | null;
  width?: number | null;
};

export type SpotifyArtist = {
  id?: string;
  name: string;
};

export type SpotifyAlbum = {
  id?: string;
  name?: string;
  images?: SpotifyImage[];
};

export type SpotifyTrackItem = {
  id: string;
  name: string;
  artists?: SpotifyArtist[];
  album?: SpotifyAlbum;
  uri: string;
  duration_ms: number;
  preview_url?: string | null;
};
