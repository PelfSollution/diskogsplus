import React, { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import Layout from "@/components/Layout";
import { useRouter } from "next/router";
import Link from "next/link";
import useGetUserData from "@/hooks/useGetUserData";
import useGetMixtape from "@/hooks/useGetMixtape";
import useMixtapes from "@/hooks/useMixtapes";
import useTrackPlayer from "@/hooks/useTrackPlayer";
import { deleteFromMixtape, mixtapeChatHref } from "@/services/client/mixtape";
import { camelotCompatible } from "@/lib/mixtapeOrder";
import VinylDisc from "@/components/VinylDisc";
import CamelotChip from "@/components/CamelotChip";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Trash2,
  Share2,
  Disc3,
  ExternalLink,
  Bot,
  ListMusic,
  Check,
} from "lucide-react";
import CustomSnackbar from "@/components/CustomSnackbar";

const jsonFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
};

export default function MixtapePlayer() {
  const router = useRouter();
  const { data: userData } = useGetUserData();
  const username = userData?.userProfile?.username || "";

  // Mixtape de ?id= o, si no viene, la activa. undefined mientras carga; null en modo local
  const mixtapes = useMixtapes(username);
  const queryId = Number(router.query.id);
  const mixtapeId =
    mixtapes.activeId == null
      ? mixtapes.activeId
      : Number.isInteger(queryId) && mixtapes.mixtapes?.some((m) => m.id === queryId)
      ? queryId
      : mixtapes.activeId;
  const mixtapeName = mixtapes.mixtapes?.find((m) => m.id === mixtapeId)?.nombre;
  const { data: mixtape, isLoading, reload: reloadMixtape } = useGetMixtape(username, mixtapeId);

  const [currentIndex, setCurrentIndex] = useState(0);
  // Intención del usuario de escuchar: los navegadores bloquean el autoplay hasta el primer clic
  const [wantsToPlay, setWantsToPlay] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLoop, setIsLoop] = useState(false);
  const [copied, setCopied] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Asegurar que currentIndex no quede fuera de rango
  useEffect(() => {
    if (mixtape && mixtape.length > 0 && currentIndex >= mixtape.length) {
      setCurrentIndex(0);
    }
  }, [mixtape, currentIndex]);

  const currentTrack = mixtape && mixtape.length > 0 ? mixtape[currentIndex] : null;

  const handleNext = () => {
    if (!mixtape || mixtape.length === 0) return;
    if (isShuffle) {
      const nextRandom = Math.floor(Math.random() * mixtape.length);
      setCurrentIndex(nextRandom);
    } else {
      setCurrentIndex((prev) => (prev + 1) % mixtape.length);
    }
    setWantsToPlay(true);
  };

  const handlePrev = () => {
    if (!mixtape || mixtape.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + mixtape.length) % mixtape.length);
    setWantsToPlay(true);
  };

  // Fin de pista: siguiente, o parar al final de la lista si no está activado repetir
  const handleTrackEnded = () => {
    if (!mixtape || mixtape.length === 0) return;
    if (!isShuffle && !isLoop && currentIndex >= mixtape.length - 1) {
      setWantsToPlay(false);
      return;
    }
    // Con una sola pista, handleNext no cambia de índice: volver a empezar
    if (mixtape.length === 1) {
      play();
      return;
    }
    handleNext();
  };

  const { containerRef, load, play, pause, isPlaying, mode } = useTrackPlayer({
    onEnded: handleTrackEnded,
    onError: handleTrackEnded,
  });

  const handleDeleteCurrent = async (trackToDelete: any) => {
    if (!trackToDelete) return;
    try {
      await deleteFromMixtape(
        username,
        mixtapeId ?? null,
        trackToDelete.artista,
        trackToDelete.trackname,
        trackToDelete.disco_id
      );
      setSnackbarMessage(`"${trackToDelete.trackname}" eliminada de la mixtape.`);
      setSnackbarOpen(true);
      if (currentIndex >= mixtape.length - 1) {
        setCurrentIndex(Math.max(0, mixtape.length - 2));
      }
      reloadMixtape();
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = (platform: "twitter" | "whatsapp" | "copy") => {
    const shareText = `Escuchando mi Mixtape en Diskogs+: ${
      currentTrack ? `${currentTrack.trackname} de ${currentTrack.artista}` : "Colección de vinilos"
    }`;
    const url = typeof window !== "undefined" ? window.location.href : "https://diskogsplus.local";

    if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`,
        "_blank"
      );
    } else if (platform === "whatsapp") {
      window.open(
        `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} - ${url}`)}`,
        "_blank"
      );
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setSnackbarMessage("Enlace de la Mixtape copiado al portapapeles.");
      setSnackbarOpen(true);
    }
  };

  const redirectToDiscbot = () => {
    if (!mixtape || mixtape.length === 0) return;
    router.push(mixtapeChatHref(username, mixtapeId, mixtapeName || "Mi mixtape"));
  };

  // Vídeo de la pista a partir de los vídeos que Discogs enlaza en el disco
  // (el embed de YouTube por búsqueda dejó de funcionar en 2020)
  const videoKey =
    currentTrack?.disco_id && currentTrack?.trackname
      ? `/api/mixtape/video?disco_id=${encodeURIComponent(currentTrack.disco_id)}&track=${encodeURIComponent(currentTrack.trackname)}`
      : null;
  const { data: videoData, isLoading: isVideoLoading } = useSWR(videoKey, jsonFetcher, {
    revalidateOnFocus: false,
  });
  const videoId: string | null = videoData?.video?.videoId ?? null;
  const preview: string | null = videoData?.video?.preview ?? null;
  const hasAudio = Boolean(videoId || preview);

  // Cargar la pista actual en el reproductor cuando llega su vídeo o preview
  const wantsToPlayRef = useRef(wantsToPlay);
  useEffect(() => {
    wantsToPlayRef.current = wantsToPlay;
  }, [wantsToPlay]);
  useEffect(() => {
    if (!videoKey || isVideoLoading) return;
    load({ videoId, preview }, wantsToPlayRef.current);
  }, [videoKey, isVideoLoading, videoId, preview, load]);

  // Pista sin audio en ninguna fuente: saltarla si se estaba escuchando la lista
  const skipRef = useRef(handleTrackEnded);
  useEffect(() => {
    skipRef.current = handleTrackEnded;
  });
  useEffect(() => {
    if (!videoKey || isVideoLoading || hasAudio || !wantsToPlay) return;
    const timer = setTimeout(() => skipRef.current(), 3000);
    return () => clearTimeout(timer);
  }, [videoKey, isVideoLoading, hasAudio, wantsToPlay]);

  const togglePlay = () => {
    if (isPlaying) {
      pause();
      setWantsToPlay(false);
    } else {
      setWantsToPlay(true);
      play();
    }
  };
  const youtubeSearchUrl = currentTrack
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${currentTrack.artista} ${currentTrack.trackname}`
      )}`
    : "";

  // Siguiente pista en orden (sin aleatorio) y si mezcla bien con la actual
  const nextTrack =
    mixtape && mixtape.length > 1 && !isShuffle ? mixtape[(currentIndex + 1) % mixtape.length] : null;
  const nextFits = currentTrack && nextTrack ? camelotCompatible(currentTrack, nextTrack) : null;

  const outlineButton =
    "tw-flex tw-items-center tw-gap-2 tw-h-10 tw-px-4 tw-rounded-full tw-border tw-border-gray-200 tw-bg-white tw-text-sm tw-font-medium tw-text-gray-900 hover:tw-bg-gray-50 tw-transition-colors";
  const toggleButton = (active: boolean) =>
    `tw-w-11 tw-h-11 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-transition-colors ${
      active ? "tw-bg-brand-100 tw-text-brand-800" : "tw-text-gray-500 hover:tw-text-gray-900 hover:tw-bg-gray-100"
    }`;

  return (
    <Layout
      title={currentTrack ? `▶ ${currentTrack.trackname} · ${mixtapeName || "Mixtape"} | Diskogs+` : "Reproductor | Diskogs+"}
      description="Reproductor de la mixtape con YouTube y Deezer"
      centeredTopContent={true}
    >
      <div className="tw-max-w-6xl tw-mx-auto tw-px-4 md:tw-px-10 tw-py-8 tw-flex tw-flex-col tw-gap-8">
        {/* Cabecera */}
        <header className="tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-4">
          <div>
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-brand-700">Reproduciendo la mixtape</span>
            <h1 className="tw-text-2xl md:tw-text-3xl tw-font-bold tw-tracking-tight tw-text-gray-900 tw-mt-1">
              {mixtapeName || "Mixtape"}
            </h1>
            <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
              {mixtape ? (mixtape.length === 1 ? "1 pista" : `${mixtape.length} pistas`) : "Cargando…"}
            </p>
          </div>
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            <button type="button" onClick={redirectToDiscbot} className={outlineButton}>
              <Bot className="tw-w-4 tw-h-4" />
              Analizar con DiscBOT
            </button>
            <Link href={mixtapeId ? `/mixtape?id=${mixtapeId}` : "/mixtape"} className={outlineButton}>
              <ListMusic className="tw-w-4 tw-h-4" />
              Editar la mixtape
            </Link>
          </div>
        </header>

        {/* Mixtape vacía */}
        {!isLoading && (!mixtape || mixtape.length === 0) && (
          <div className="tw-flex tw-flex-col tw-items-center tw-text-center tw-gap-4 tw-py-16 tw-border tw-border-dashed tw-border-gray-300 tw-rounded-2xl">
            <VinylDisc size={96} flat />
            <div>
              <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">La mixtape está vacía</h2>
              <p className="tw-text-sm tw-text-gray-500 tw-mt-1 tw-max-w-sm">
                Abre un disco de tu colección y pulsa «+» en las pistas que quieras pinchar.
              </p>
            </div>
            <Link
              href="/albums"
              className="tw-flex tw-items-center tw-gap-2 tw-h-11 tw-px-5 tw-rounded-full tw-bg-brand-600 hover:tw-bg-brand-700 tw-text-white tw-text-sm tw-font-semibold"
            >
              <Disc3 className="tw-w-4 tw-h-4" />
              Ir a la colección
            </Link>
          </div>
        )}

        {mixtape && mixtape.length > 0 && currentTrack && (
          <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-12 tw-gap-10">
            {/* Tocadiscos: vinilo con la portada de la pista, datos, controles y vídeo */}
            <div className="lg:tw-col-span-7 tw-flex tw-flex-col tw-gap-6">
              <div className="tw-relative tw-w-full tw-max-w-[360px] tw-mx-auto">
                <VinylDisc size="fill" cover={currentTrack.cover_url} spinning={isPlaying} />
                {/* Brazo del tocadiscos (decorativo) */}
                <div aria-hidden="true" className="tw-absolute tw--right-3 tw-top-0 tw-h-[62%] tw-w-10">
                  <span className="tw-absolute tw-right-1 tw-top-0 tw-w-7 tw-h-7 tw-rounded-full tw-bg-gray-300 tw-border-4 tw-border-gray-400" />
                  <span
                    className="tw-absolute tw-right-[18px] tw-top-5 tw-w-1.5 tw-h-full tw-rounded-full tw-bg-gray-400 tw-origin-top tw-transition-transform tw-duration-700"
                    style={{ transform: `rotate(${isPlaying ? 22 : 8}deg)` }}
                  />
                </div>
              </div>

              <div className="tw-text-center tw-flex tw-flex-col tw-items-center tw-gap-2">
                <h2 className="tw-text-2xl tw-font-bold tw-tracking-tight tw-text-gray-900">{currentTrack.trackname}</h2>
                <p className="tw-text-base tw-text-gray-600">{currentTrack.artista}</p>
                <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-2 tw-mt-1">
                  {currentTrack.vinyl_position && (
                    <span className="tw-font-mono tw-text-xs tw-font-semibold tw-text-gray-700 tw-bg-gray-100 tw-border tw-border-gray-200 tw-rounded-md tw-px-1.5 tw-py-0.5">
                      {currentTrack.vinyl_position}
                    </span>
                  )}
                  {currentTrack.tempo ? (
                    <span className="tw-font-mono tw-text-xs tw-font-semibold tw-text-gray-700 tw-bg-gray-100 tw-border tw-border-gray-200 tw-rounded-md tw-px-1.5 tw-py-0.5">
                      {Math.round(currentTrack.tempo)} BPM
                    </span>
                  ) : null}
                  <CamelotChip keyIndex={currentTrack.key} mode={currentTrack.mode} />
                  <Link
                    href={`/albums/${currentTrack.disco_id}`}
                    className="tw-flex tw-items-center tw-gap-1 tw-text-xs tw-font-medium tw-text-gray-600 hover:tw-text-gray-900 tw-px-2 tw-py-0.5"
                  >
                    {currentTrack.album || "Ver el disco"}
                    <ExternalLink className="tw-w-3 tw-h-3" />
                  </Link>
                </div>
              </div>

              {/* Controles */}
              <div className="tw-flex tw-items-center tw-justify-center tw-gap-4">
                <button
                  type="button"
                  onClick={() => setIsShuffle(!isShuffle)}
                  aria-pressed={isShuffle}
                  className={toggleButton(isShuffle)}
                  title="Reproducción aleatoria"
                  aria-label="Reproducción aleatoria"
                >
                  <Shuffle className="tw-w-5 tw-h-5" />
                </button>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="tw-w-12 tw-h-12 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-gray-700 hover:tw-bg-gray-100"
                  aria-label="Pista anterior"
                >
                  <SkipBack className="tw-w-6 tw-h-6 tw-fill-current" />
                </button>
                <button
                  type="button"
                  onClick={togglePlay}
                  className="tw-w-16 tw-h-16 tw-rounded-full tw-bg-brand-600 hover:tw-bg-brand-700 tw-text-white tw-flex tw-items-center tw-justify-center tw-shadow-md tw-transition-colors"
                  aria-label={isPlaying ? "Pausar" : "Reproducir"}
                >
                  {isPlaying ? <Pause className="tw-w-7 tw-h-7 tw-fill-current" /> : <Play className="tw-w-7 tw-h-7 tw-fill-current tw-ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="tw-w-12 tw-h-12 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-gray-700 hover:tw-bg-gray-100"
                  aria-label="Pista siguiente"
                >
                  <SkipForward className="tw-w-6 tw-h-6 tw-fill-current" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsLoop(!isLoop)}
                  aria-pressed={isLoop}
                  className={toggleButton(isLoop)}
                  title="Repetir la lista"
                  aria-label="Repetir la lista"
                >
                  <Repeat className="tw-w-5 tw-h-5" />
                </button>
              </div>

              {/* Siguiente pista y si encaja */}
              {nextTrack && (
                <div className="tw-flex tw-items-center tw-gap-3 tw-p-3 tw-rounded-xl tw-border tw-border-gray-200">
                  {nextTrack.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={nextTrack.cover_url} alt="" className="tw-w-11 tw-h-11 tw-rounded tw-object-cover tw-bg-gray-100" />
                  ) : (
                    <span className="tw-w-11 tw-h-11 tw-rounded tw-bg-gray-100" />
                  )}
                  <div className="tw-flex-1 tw-min-w-0">
                    <p className="tw-text-xs tw-text-gray-500">
                      Siguiente
                      {nextTrack.vinyl_position ? ` · ${nextTrack.vinyl_position}` : ""}
                      {nextTrack.tempo ? ` · ${Math.round(nextTrack.tempo)} BPM` : ""}
                    </p>
                    <p className="tw-text-sm tw-font-semibold tw-text-gray-900 tw-truncate">{nextTrack.trackname}</p>
                  </div>
                  <CamelotChip
                    keyIndex={nextTrack.key}
                    mode={nextTrack.mode}
                    suffix={nextFits === null ? undefined : nextFits ? "· encaja" : "· salto"}
                  />
                </div>
              )}

              {/* Vídeo de YouTube (API de JavaScript) o preview de Deezer */}
              <div className="tw-relative tw-aspect-video tw-w-full tw-rounded-xl tw-overflow-hidden tw-bg-gray-900">
                <div ref={containerRef} className="tw-absolute tw-inset-0" />
                {mode !== "video" && (
                  <div className="tw-absolute tw-inset-0 tw-bg-gray-100 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-text-center tw-px-4 tw-text-gray-500 tw-text-sm">
                    {isVideoLoading ? (
                      <span>Buscando la pista…</span>
                    ) : mode === "audio" ? (
                      <span>Preview de 30 s · Deezer</span>
                    ) : (
                      <>
                        <span>
                          No se ha encontrado audio para esta pista
                          {wantsToPlay ? "; pasando a la siguiente…" : "."}
                        </span>
                        <a
                          href={youtubeSearchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tw-inline-flex tw-items-center tw-gap-1 tw-text-brand-700 hover:tw-text-brand-800 tw-font-semibold"
                        >
                          Buscar en YouTube <ExternalLink className="tw-w-3.5 tw-h-3.5" />
                        </a>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Compartir */}
              <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-sm">
                <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-gray-500 tw-mr-1">Compartir</span>
                <button
                  type="button"
                  onClick={() => handleShare("copy")}
                  className="tw-flex tw-items-center tw-gap-1.5 tw-h-9 tw-px-3 tw-rounded-lg tw-text-gray-700 hover:tw-bg-gray-100"
                >
                  {copied ? <Check className="tw-w-4 tw-h-4 tw-text-brand-600" /> : <Share2 className="tw-w-4 tw-h-4" />}
                  {copied ? "Copiado" : "Copiar enlace"}
                </button>
                <button type="button" onClick={() => handleShare("whatsapp")} className="tw-h-9 tw-px-3 tw-rounded-lg tw-text-gray-700 hover:tw-bg-gray-100">
                  WhatsApp
                </button>
                <button type="button" onClick={() => handleShare("twitter")} className="tw-h-9 tw-px-3 tw-rounded-lg tw-text-gray-700 hover:tw-bg-gray-100">
                  X / Twitter
                </button>
              </div>
            </div>

            {/* Cola */}
            <aside className="lg:tw-col-span-5">
              <div className="lg:tw-sticky lg:tw-top-6">
                <div className="tw-flex tw-items-baseline tw-justify-between tw-px-2 tw-pb-2 tw-border-b tw-border-gray-200">
                  <h2 className="tw-text-[15px] tw-font-bold tw-text-gray-900">Cola</h2>
                  <span className="tw-text-xs tw-text-gray-500 tw-tabular-nums">
                    {currentIndex + 1} de {mixtape.length}
                  </span>
                </div>
                <ol className="tw-max-h-[640px] tw-overflow-y-auto">
                  {mixtape.map((track, idx) => {
                    const isCurrent = idx === currentIndex;
                    return (
                      <li
                        key={`${track.disco_id}-${track.trackname}-${idx}`}
                        className={`tw-group tw-flex tw-items-center tw-gap-3 tw-px-2 tw-py-2 tw-border-b tw-border-gray-100 tw-rounded-md ${
                          isCurrent ? "tw-bg-brand-50" : "hover:tw-bg-gray-50"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentIndex(idx);
                            setWantsToPlay(true);
                          }}
                          className="tw-flex tw-flex-1 tw-min-w-0 tw-items-center tw-gap-3 tw-text-left"
                          aria-current={isCurrent ? "true" : undefined}
                        >
                          <span className={`tw-w-5 tw-text-center tw-font-mono tw-text-xs ${isCurrent ? "tw-text-brand-700" : "tw-text-gray-500"}`}>
                            {isCurrent ? <Play className="tw-w-3.5 tw-h-3.5 tw-inline tw-fill-current" /> : idx + 1}
                          </span>
                          {track.cover_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={track.cover_url} alt="" loading="lazy" className="tw-w-10 tw-h-10 tw-rounded tw-object-cover tw-bg-gray-100 tw-shrink-0" />
                          ) : (
                            <span className="tw-w-10 tw-h-10 tw-rounded tw-bg-gray-100 tw-shrink-0" />
                          )}
                          <span className="tw-min-w-0">
                            <span className={`tw-block tw-text-sm tw-font-semibold tw-truncate ${isCurrent ? "tw-text-brand-800" : "tw-text-gray-900"}`}>
                              {track.trackname}
                            </span>
                            <span className="tw-block tw-text-[13px] tw-text-gray-500 tw-truncate">{track.artista}</span>
                          </span>
                        </button>
                        <CamelotChip keyIndex={track.key} mode={track.mode} />
                        <button
                          type="button"
                          onClick={() => handleDeleteCurrent(track)}
                          className="tw-w-8 tw-h-8 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-text-gray-400 hover:tw-text-red-600 hover:tw-bg-red-50 md:tw-opacity-0 group-hover:tw-opacity-100 focus-visible:tw-opacity-100"
                          aria-label={`Quitar «${track.trackname}» de la mixtape`}
                          title="Quitar de la mixtape"
                        >
                          <Trash2 className="tw-w-4 tw-h-4" />
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </aside>
          </div>
        )}
      </div>

      <CustomSnackbar isOpen={snackbarOpen} message={snackbarMessage} onClose={() => setSnackbarOpen(false)} />
    </Layout>
  );
}
