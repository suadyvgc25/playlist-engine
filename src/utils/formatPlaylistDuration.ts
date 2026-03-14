export function formatPlaylistDuration(totalMs: number): string {
  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes} min ${seconds.toString().padStart(2, "0")} sec`;
}