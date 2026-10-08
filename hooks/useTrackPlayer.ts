import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Reproductor de pistas: vídeos con la API de JavaScript de YouTube (pausa real
 * y aviso al terminar) y previews de 30 s de Deezer con un <audio>.
 *
 * Uso: renderizar `<div ref={containerRef} />` donde deba ir el vídeo (callback ref,
 * para poder pasar el objeto del hook entre componentes) y llamar a
 * `load({ videoId, preview })`. `onEnded` salta cuando termina la pista y
 * `onError` cuando YouTube no deja reproducir el vídeo incrustado.
 */

export interface PlayableTrack {
  videoId?: string | null;
  preview?: string | null;
}

interface Options {
  onEnded?: () => void;
  onError?: () => void;
}

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<any> | null = null;

function loadYouTubeApi(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("Sin navegador"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });
  return apiPromise;
}

export default function useTrackPlayer({ onEnded, onError }: Options = {}) {
  const containerElRef = useRef<HTMLDivElement | null>(null);
  // Vídeo pedido antes de que el contenedor esté en pantalla
  const pendingRef = useRef<{ videoId: string; autoplay: boolean } | null>(null);
  const loadVideoRef = useRef<(videoId: string, autoplay: boolean) => Promise<void>>(async () => {});
  const containerRef = useCallback((el: HTMLDivElement | null) => {
    containerElRef.current = el;
    if (el && pendingRef.current) {
      const { videoId, autoplay } = pendingRef.current;
      pendingRef.current = null;
      loadVideoRef.current(videoId, autoplay);
    }
  }, []);
  const playerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const modeRef = useRef<"video" | "audio" | null>(null);
  const callbacks = useRef({ onEnded, onError });
  useEffect(() => {
    callbacks.current = { onEnded, onError };
  }, [onEnded, onError]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<"video" | "audio" | null>(null);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.addEventListener("play", () => setIsPlaying(true));
      audio.addEventListener("pause", () => setIsPlaying(false));
      audio.addEventListener("ended", () => callbacks.current.onEnded?.());
      audio.addEventListener("error", () => callbacks.current.onError?.());
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const loadVideo = useCallback(async (videoId: string, autoplay: boolean) => {
    const YT = await loadYouTubeApi();
    if (playerRef.current) {
      if (autoplay) playerRef.current.loadVideoById(videoId);
      else playerRef.current.cueVideoById(videoId);
      return;
    }
    if (!containerElRef.current) {
      pendingRef.current = { videoId, autoplay };
      return;
    }
    // YT.Player sustituye el elemento por un iframe: usar un hijo que React no gestione
    const mount = document.createElement("div");
    containerElRef.current.appendChild(mount);
    playerRef.current = new YT.Player(mount, {
      host: "https://www.youtube-nocookie.com",
      width: "100%",
      height: "100%",
      videoId,
      playerVars: { autoplay: autoplay ? 1 : 0, playsinline: 1, rel: 0 },
      events: {
        onStateChange: (e: any) => {
          if (e.data === YT.PlayerState.PLAYING) setIsPlaying(true);
          else if (e.data === YT.PlayerState.PAUSED) setIsPlaying(false);
          else if (e.data === YT.PlayerState.ENDED) {
            setIsPlaying(false);
            callbacks.current.onEnded?.();
          }
        },
        // 101/150: el propietario no permite incrustarlo; 100: vídeo eliminado
        onError: () => {
          setIsPlaying(false);
          callbacks.current.onError?.();
        },
      },
    });
  }, []);
  useEffect(() => {
    loadVideoRef.current = loadVideo;
  }, [loadVideo]);

  const load = useCallback(
    (track: PlayableTrack, autoplay = true) => {
      if (track.videoId) {
        audioRef.current?.pause();
        modeRef.current = "video";
        setMode("video");
        loadVideo(track.videoId, autoplay).catch(() => callbacks.current.onError?.());
      } else if (track.preview) {
        playerRef.current?.pauseVideo?.();
        modeRef.current = "audio";
        setMode("audio");
        const audio = getAudio();
        audio.src = track.preview;
        if (autoplay) audio.play().catch(() => setIsPlaying(false));
      } else {
        playerRef.current?.pauseVideo?.();
        audioRef.current?.pause();
        modeRef.current = null;
        setMode(null);
        setIsPlaying(false);
      }
    },
    [getAudio, loadVideo]
  );

  const play = useCallback(() => {
    if (modeRef.current === "video") playerRef.current?.playVideo?.();
    else if (modeRef.current === "audio") audioRef.current?.play().catch(() => {});
  }, []);

  const pause = useCallback(() => {
    if (modeRef.current === "video") playerRef.current?.pauseVideo?.();
    else if (modeRef.current === "audio") audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy?.();
      playerRef.current = null;
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return { containerRef, load, play, pause, toggle, isPlaying, mode };
}
