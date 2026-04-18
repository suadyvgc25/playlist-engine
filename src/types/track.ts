export type Track = {
  id: string;
  name: string;
  artist: string;
  album: string;
  imageUrl?: string;
  uri: string;
  duration: number;
  previewUrl?: string | null;
};
