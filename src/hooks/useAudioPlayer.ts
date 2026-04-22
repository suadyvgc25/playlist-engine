import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { fetchPreviewFromiTunes } from "../services/spotify/search";
import type { Track } from "../types/track";

export type PlaybackSource = "search" | "playlist";

export type PlayTrackOptions = {
  preview?: boolean;
  toggle?: boolean;
  source?: PlaybackSource;
  queueIndex?: number;
};

type UseAudioPlayerParams = {
  results: Track[];
  playlistTracks: Track[];
  setResults: Dispatch<SetStateAction<Track[]>>;
  setPlaylistTracks: Dispatch<SetStateAction<Track[]>>;
};

export function useAudioPlayer({
  results,
  playlistTracks,
  setResults,
  setPlaylistTracks,
}: UseAudioPlayerParams) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHoverPreview, setIsHoverPreview] = useState(false);
  const [tracksWithoutPreviews, setTracksWithoutPreviews] = useState<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hoverTrackIdRef = useRef<string | null>(null);
  const playbackSourceRef = useRef<PlaybackSource>("search");
  const playbackIndexRef = useRef(-1);
  const playRequestIdRef = useRef(0);

  if (!audioRef.current) {
    const audio = new Audio();
    audio.preload = "auto";
    audio.setAttribute("playsinline", "true");
    audioRef.current = audio;
  }

  function clearAudio(audio: HTMLAudioElement) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    setIsPlaying(false);
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.onended = () => {
      setIsPlaying(false);
    };

    return () => {
      audio.onended = null;
    };
  }, []);

  function clearUnavailablePreview(trackId: string) {
    setTracksWithoutPreviews((prev) => {
      const next = new Set(prev);
      next.delete(trackId);
      return next;
    });
  }

  function clearUnavailablePreviews() {
    setTracksWithoutPreviews(new Set());
  }

  async function playTrack(
    track: Track,
    {
      preview = false,
      toggle = false,
      source,
      queueIndex,
    }: PlayTrackOptions = {}
  ) {
    const requestId = playRequestIdRef.current + 1;
    playRequestIdRef.current = requestId;

    if (preview) {
      setIsHoverPreview(true);
    } else {
      setIsHoverPreview(false);
      hoverTrackIdRef.current = null;
    }

    if (!audioRef.current) return false;
    const audio = audioRef.current;
    const isSameTrack = currentTrack?.id === track.id;

    if (toggle && isSameTrack && (track.previewUrl || audio.currentSrc)) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        try {
          await audio.play();
          if (playRequestIdRef.current !== requestId) {
            return false;
          }
          setIsPlaying(true);
        } catch (err) {
          console.warn("Preview playback failed", err);
          setIsPlaying(false);
          return false;
        }
      }
      return true;
    }

    if (preview) {
      hoverTrackIdRef.current = track.id;
    } else {
      audio.pause();
      setIsPlaying(false);

      const nextSource =
        source ??
        (playlistTracks.some((playlistTrack) => playlistTrack.id === track.id)
          ? "playlist"
          : "search");
      const nextQueue = nextSource === "playlist" ? playlistTracks : results;
      const nextIndex =
        typeof queueIndex === "number"
          ? queueIndex
          : nextQueue.findIndex((queueTrack) => queueTrack.id === track.id);

      playbackSourceRef.current = nextSource;
      playbackIndexRef.current = nextIndex;
      setCurrentTrack(track);
    }

    let previewUrl = track.previewUrl;

    if (!previewUrl) {
      try {
        previewUrl = await fetchPreviewFromiTunes(track);
      } catch (err) {
        console.warn("Preview lookup failed", err);
        previewUrl = undefined;
      }

      if (preview && hoverTrackIdRef.current !== track.id) {
        return false;
      }

      if (playRequestIdRef.current !== requestId) {
        return false;
      }
    }

    if (!previewUrl) {
      console.warn("No preview available");

      if (!preview) {
        clearAudio(audio);
        setTracksWithoutPreviews((prev) => new Set(prev).add(track.id));
      }
      return false;
    }

    if (playRequestIdRef.current !== requestId) {
      return false;
    }

    audio.pause();
    audio.src = previewUrl;
    audio.currentTime = 0;

    setCurrentTrack({
      ...track,
      previewUrl,
    });

    try {
      await audio.play();
    } catch (err) {
      console.warn("Preview playback failed", err);
      setIsPlaying(false);
      return true;
    }

    if (playRequestIdRef.current !== requestId) {
      return false;
    }

    setTracksWithoutPreviews((prev) => {
      const next = new Set(prev);
      next.delete(track.id);
      return next;
    });
    setPlaylistTracks((prev) =>
      prev.map((playlistTrack) =>
        playlistTrack.id === track.id ? { ...playlistTrack, previewUrl } : playlistTrack
      )
    );
    setResults((prev) =>
      prev.map((resultTrack) =>
        resultTrack.id === track.id ? { ...resultTrack, previewUrl } : resultTrack
      )
    );
    setIsPlaying(true);

    if (preview) {
      setIsHoverPreview(true);
    } else {
      setIsHoverPreview(false);
      hoverTrackIdRef.current = null;
    }

    return true;
  }

  function stopPreview() {
    if (!isHoverPreview) return;

    hoverTrackIdRef.current = null;

    if (!audioRef.current) return;

    audioRef.current.pause();
    setIsPlaying(false);
  }

  async function playNextTrack() {
    const playbackSource = playbackSourceRef.current;
    const playbackQueue = playbackSource === "playlist" ? playlistTracks : results;

    if (playbackQueue.length === 0) return;

    const currentIndex = playbackIndexRef.current >= 0
      ? playbackIndexRef.current
      : currentTrack
      ? playbackQueue.findIndex((track) => track.id === currentTrack.id)
      : -1;

    for (let offset = 1; offset <= playbackQueue.length; offset += 1) {
      const nextIndex = (currentIndex + offset) % playbackQueue.length;
      const nextTrack = playbackQueue[nextIndex];
      const didPlay = await playTrack(nextTrack, {
        preview: false,
        source: playbackSource,
        queueIndex: nextIndex,
      });
      if (didPlay) {
        return;
      }
    }
  }

  return {
    currentTrack,
    isPlaying,
    isHoverPreview,
    tracksWithoutPreviews,
    playTrack,
    stopPreview,
    playNextTrack,
    clearUnavailablePreview,
    clearUnavailablePreviews,
  };
}
