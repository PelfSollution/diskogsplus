import React, { useState, useEffect } from "react";
import useSWR from "swr";
import Layout from "@/components/Layout";
import { useRouter } from "next/router";
import Link from "next/link";
import useGetUserData from "@/hooks/useGetUserData";
import useGetMixtape from "@/hooks/useGetMixtape";
import deleteFromMixtape from "@/services/supabase/deleteFromMixtape";
import { getCamelotColor, getPitchClassNotation } from "@/lib/musicNotation";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Trash2,
  Share2,
  Disc,
  Music2,
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

  const { data: mixtape, isLoading } = useGetMixtape(username);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
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
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (!mixtape || mixtape.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + mixtape.length) % mixtape.length);
    setIsPlaying(true);
  };

  const handleDeleteCurrent = async (trackToDelete: any) => {
    if (!trackToDelete) return;
    try {
      await deleteFromMixtape(
        username,
        trackToDelete.artista,
        trackToDelete.trackname,
        trackToDelete.disco_id
      );
      setSnackbarMessage(`"${trackToDelete.trackname}" eliminada de la mixtape.`);
      setSnackbarOpen(true);
      if (currentIndex >= mixtape.length - 1) {
        setCurrentIndex(Math.max(0, mixtape.length - 2));
      }
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
    const trackListSummary = mixtape
      .slice(0, 5)
      .map((t) => `${t.artista} - ${t.trackname}`)
      .join(", ");
    router.push(
      `/chat?username=${encodeURIComponent(username)}&artista=Mixtape&album=Mixtape%20Personal`
    );
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
  const videoId: string | undefined = videoData?.video?.videoId;
  const youtubeEmbedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`
    : "";
  const youtubeSearchUrl = currentTrack
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${currentTrack.artista} ${currentTrack.trackname}`
      )}`
    : "";

  const keyInfo =
    currentTrack &&
    typeof currentTrack.key === "number" &&
    typeof currentTrack.mode === "number"
      ? getPitchClassNotation(currentTrack.key, currentTrack.mode)
      : null;

  return (
    <Layout
      title={
        currentTrack
          ? `▶ ${currentTrack.trackname} - Mixtape Player | Diskogs +`
          : "Mixtape Player | Diskogs +"
      }
      description="Reproductor de vinilos y mixtape musical continuo con YouTube"
      centeredTopContent={true}
    >
      <div className="tw-container tw-mx-auto tw-max-w-6xl tw-p-4 md:tw-p-6">
        {/* Cabecera */}
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4 tw-mb-6">
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-w-12 tw-h-12 tw-rounded-2xl tw-bg-gradient-to-tr tw-from-amber-500 tw-to-purple-600 tw-flex tw-items-center tw-justify-center tw-text-white tw-shadow-md">
              <Disc className={`tw-w-7 tw-h-7 ${isPlaying ? "tw-animate-spin" : ""}`} style={{ animationDuration: "6s" }} />
            </div>
            <div>
              <div className="tw-flex tw-items-center tw-gap-2">
                <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900 dark:tw-text-white">
                  Mixtape Player
                </h1>
                <span className="tw-text-xs tw-bg-red-100 dark:tw-bg-red-950/50 tw-text-red-600 dark:tw-text-red-400 tw-px-2 tw-py-0.5 tw-rounded-md tw-font-semibold">
                  YouTube Audio
                </span>
              </div>
              <p className="tw-text-sm tw-text-gray-500 dark:tw-text-gray-400">
                {mixtape ? `${mixtape.length} canciones seleccionadas` : "Cargando..."}
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="tw-flex tw-items-center tw-gap-2">
            <button
              type="button"
              onClick={redirectToDiscbot}
              className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-px-3.5 tw-py-2 tw-rounded-xl tw-bg-purple-100 dark:tw-bg-purple-950/50 tw-text-purple-700 dark:tw-text-purple-300 hover:tw-bg-purple-200 dark:hover:tw-bg-purple-900/60 tw-transition-colors"
            >
              <Bot className="tw-w-4 tw-h-4" />
              <span>Analizar Armonía con DiscBOT</span>
            </button>

            <Link
              href="/mixtape"
              className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-px-3.5 tw-py-2 tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-text-gray-700 dark:tw-text-gray-200 hover:tw-bg-gray-100 dark:hover:tw-bg-gray-800 tw-transition-colors"
            >
              <ListMusic className="tw-w-4 tw-h-4" />
              <span>Gestionar Lista</span>
            </Link>
          </div>
        </div>

        {/* Estado Vacío */}
        {!isLoading && (!mixtape || mixtape.length === 0) && (
          <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-3xl tw-p-10 tw-text-center tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-sm tw-max-w-lg tw-mx-auto tw-my-12">
            <div className="tw-w-16 tw-h-16 tw-rounded-2xl tw-bg-amber-100 dark:tw-bg-amber-950/50 tw-text-amber-600 tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-4">
              <Music2 className="tw-w-8 tw-h-8" />
            </div>
            <h2 className="tw-text-xl tw-font-bold tw-text-gray-900 dark:tw-text-white tw-mb-2">
              Tu Mixtape está vacía
            </h2>
            <p className="tw-text-sm tw-text-gray-500 tw-mb-6">
              Añade canciones a tu mixtape explorando los vinilos del catálogo y pulsando el botón &quot;+ Mixtape&quot; en cualquier pista.
            </p>
            <Link
              href="/albums"
              className="tw-inline-flex tw-items-center tw-gap-2 tw-px-5 tw-py-2.5 tw-rounded-xl tw-bg-amber-500 hover:tw-bg-amber-600 tw-text-white tw-font-medium tw-text-sm tw-transition-colors tw-shadow-md"
            >
              <Disc className="tw-w-4 tw-h-4" />
              <span>Explorar Catálogo de Vinilos</span>
            </Link>
          </div>
        )}

        {/* Reproductor Principal y Cola de Reproducción */}
        {mixtape && mixtape.length > 0 && currentTrack && (
          <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-12 tw-gap-6">
            {/* Columna Izquierda: Deck Principal del Vinilo y Controles (7 cols) */}
            <div className="lg:tw-col-span-7 tw-space-y-5">
              <div className="tw-bg-gradient-to-b tw-from-gray-900 tw-to-gray-950 tw-rounded-3xl tw-p-6 md:tw-p-8 tw-text-white tw-shadow-2xl tw-border tw-border-gray-800 tw-relative tw-overflow-hidden">
                {/* Visualizador de Vinilo Giratorio */}
                <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-my-4">
                  <div className="tw-relative tw-w-48 tw-h-48 md:tw-w-64 md:tw-h-64">
                    {/* Disco de Vinilo */}
                    <div
                      className={`tw-w-full tw-h-full tw-rounded-full tw-bg-gradient-to-tr tw-from-black tw-via-gray-900 tw-to-zinc-800 tw-border-4 tw-border-zinc-700 tw-shadow-2xl tw-flex tw-items-center tw-justify-center ${
                        isPlaying ? "tw-animate-spin" : ""
                      }`}
                      style={{ animationDuration: "5s" }}
                    >
                      {/* Surcos del Vinilo */}
                      <div className="tw-w-4/5 tw-h-4/5 tw-rounded-full tw-border tw-border-zinc-700/50 tw-flex tw-items-center tw-justify-center">
                        <div className="tw-w-3/5 tw-h-3/5 tw-rounded-full tw-border tw-border-zinc-700/40 tw-flex tw-items-center tw-justify-center">
                          {/* Galleta Central con Título */}
                          <div className="tw-w-20 tw-h-20 md:tw-w-24 md:tw-h-24 tw-rounded-full tw-bg-gradient-to-tr tw-from-amber-600 tw-to-purple-600 tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-2 tw-text-center tw-shadow-inner">
                            <span className="tw-text-[10px] tw-font-bold tw-text-white tw-truncate tw-max-w-full">
                              {currentTrack.artista}
                            </span>
                            <div className="tw-w-3 tw-h-3 tw-rounded-full tw-bg-white tw-my-1" />
                            <span className="tw-text-[8px] tw-text-white/80 tw-truncate tw-max-w-full">
                              {currentTrack.trackname}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metadatos del Tema Actual */}
                <div className="tw-text-center tw-mt-4">
                  <h2 className="tw-text-xl md:tw-text-2xl tw-font-extrabold tw-tracking-tight tw-truncate">
                    {currentTrack.trackname}
                  </h2>
                  <p className="tw-text-base tw-text-gray-400 tw-font-medium tw-mt-1">
                    {currentTrack.artista}
                  </p>

                  <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-2 tw-mt-3">
                    <Link
                      href={`/albums/${currentTrack.disco_id}`}
                      className="tw-text-xs tw-text-purple-400 hover:tw-text-purple-300 tw-flex tw-items-center tw-gap-1 tw-bg-purple-950/50 tw-border tw-border-purple-800 tw-px-2.5 tw-py-1 tw-rounded-lg"
                    >
                      <span>Ver vinilo en catálogo</span>
                      <ExternalLink className="tw-w-3 tw-h-3" />
                    </Link>

                    {currentTrack.tempo && (
                      <span className="tw-text-xs tw-bg-gray-800 tw-text-gray-300 tw-px-2.5 tw-py-1 tw-rounded-lg tw-font-semibold">
                        ⚡ {Math.round(currentTrack.tempo)} BPM
                      </span>
                    )}

                    {keyInfo && (
                      <span
                        className={`tw-text-xs tw-font-bold tw-px-2.5 tw-py-1 tw-rounded-lg ${getCamelotColor(
                          keyInfo.camelotCode
                        )}`}
                      >
                        {keyInfo.full}
                      </span>
                    )}
                  </div>
                </div>

                {/* IFrame de YouTube Embebido */}
                <div className="tw-mt-5 tw-h-[140px] md:tw-h-[160px] tw-w-full tw-rounded-2xl tw-overflow-hidden tw-border tw-border-gray-800 tw-bg-black tw-shadow-inner">
                  {youtubeEmbedUrl ? (
                    <iframe
                      key={videoId}
                      src={youtubeEmbedUrl}
                      title={`${currentTrack.artista} - ${currentTrack.trackname}`}
                      width="100%"
                      height="100%"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="tw-w-full tw-h-full"
                    />
                  ) : (
                    <div className="tw-w-full tw-h-full tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-text-center tw-px-4 tw-text-gray-400 tw-text-sm">
                      {isVideoLoading ? (
                        <span>Buscando el vídeo de la pista…</span>
                      ) : (
                        <>
                          <span>Discogs no tiene vídeo enlazado para esta pista.</span>
                          <a
                            href={youtubeSearchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tw-inline-flex tw-items-center tw-gap-1 tw-text-red-400 hover:tw-text-red-300 tw-font-semibold"
                          >
                            Buscar en YouTube <ExternalLink className="tw-w-3.5 tw-h-3.5" />
                          </a>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Controles de Reproducción */}
                <div className="tw-flex tw-items-center tw-justify-center tw-gap-4 tw-mt-6">
                  <button
                    type="button"
                    onClick={() => setIsShuffle(!isShuffle)}
                    className={`tw-p-2.5 tw-rounded-full tw-transition-colors ${
                      isShuffle
                        ? "tw-bg-purple-600 tw-text-white"
                        : "tw-text-gray-400 hover:tw-text-white hover:tw-bg-gray-800"
                    }`}
                    title="Reproducción aleatoria"
                  >
                    <Shuffle className="tw-w-5 tw-h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handlePrev}
                    className="tw-p-3 tw-rounded-full tw-bg-gray-800 hover:tw-bg-gray-700 tw-text-white tw-transition-colors"
                    title="Pista anterior"
                  >
                    <SkipBack className="tw-w-6 tw-h-6" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="tw-p-4 tw-rounded-full tw-bg-amber-500 hover:tw-bg-amber-600 tw-text-white tw-shadow-lg tw-transition-transform hover:tw-scale-105"
                    title={isPlaying ? "Pausar animación" : "Reproducir"}
                  >
                    {isPlaying ? <Pause className="tw-w-7 tw-h-7" /> : <Play className="tw-w-7 tw-h-7" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="tw-p-3 tw-rounded-full tw-bg-gray-800 hover:tw-bg-gray-700 tw-text-white tw-transition-colors"
                    title="Siguiente pista"
                  >
                    <SkipForward className="tw-w-6 tw-h-6" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLoop(!isLoop)}
                    className={`tw-p-2.5 tw-rounded-full tw-transition-colors ${
                      isLoop
                        ? "tw-bg-purple-600 tw-text-white"
                        : "tw-text-gray-400 hover:tw-text-white hover:tw-bg-gray-800"
                    }`}
                    title="Repetir lista"
                  >
                    <Repeat className="tw-w-5 tw-h-5" />
                  </button>
                </div>
              </div>

              {/* Botones de Compartir */}
              <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-p-4 tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
                <span className="tw-text-xs tw-font-semibold tw-text-gray-500 dark:tw-text-gray-400 tw-uppercase">
                  Compartir Mixtape
                </span>
                <div className="tw-flex tw-items-center tw-gap-2">
                  <button
                    type="button"
                    onClick={() => handleShare("copy")}
                    className="tw-flex tw-items-center tw-gap-1 tw-text-xs tw-px-3 tw-py-1.5 tw-rounded-lg tw-bg-gray-100 dark:tw-bg-gray-700 hover:tw-bg-gray-200 tw-text-gray-800 dark:tw-text-gray-200 tw-transition-colors"
                  >
                    {copied ? <Check className="tw-w-3.5 tw-h-3.5 tw-text-green-500" /> : <Share2 className="tw-w-3.5 tw-h-3.5" />}
                    <span>{copied ? "Copiado" : "Copiar Enlace"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare("whatsapp")}
                    className="tw-text-xs tw-px-3 tw-py-1.5 tw-rounded-lg tw-bg-green-600 hover:tw-bg-green-700 tw-text-white tw-transition-colors"
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare("twitter")}
                    className="tw-text-xs tw-px-3 tw-py-1.5 tw-rounded-lg tw-bg-black hover:tw-bg-gray-900 tw-text-white tw-transition-colors"
                  >
                    X / Twitter
                  </button>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Cola de Reproducción Interactiva (5 cols) */}
            <div className="lg:tw-col-span-5">
              <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-3xl tw-p-5 tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-sm tw-sticky tw-top-4">
                <div className="tw-flex tw-items-center tw-justify-between tw-pb-3 tw-border-b tw-border-gray-100 dark:tw-border-gray-700 tw-mb-3">
                  <h3 className="tw-font-bold tw-text-base tw-text-gray-900 dark:tw-text-white tw-flex tw-items-center tw-gap-2">
                    <ListMusic className="tw-w-5 tw-h-5 tw-text-amber-500" />
                    <span>Cola de la Mixtape</span>
                  </h3>
                  <span className="tw-text-xs tw-font-semibold tw-text-gray-500">
                    {currentIndex + 1} de {mixtape.length}
                  </span>
                </div>

                {/* Lista de temas con scroll */}
                <div className="tw-space-y-2 tw-max-h-[520px] tw-overflow-y-auto tw-pr-1">
                  {mixtape.map((track, idx) => {
                    const isCurrent = idx === currentIndex;
                    const itemKey =
                      typeof track.key === "number" && typeof track.mode === "number"
                        ? getPitchClassNotation(track.key, track.mode)
                        : null;

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setCurrentIndex(idx);
                          setIsPlaying(true);
                        }}
                        className={`tw-flex tw-items-center tw-justify-between tw-p-3 tw-rounded-2xl tw-cursor-pointer tw-transition-all ${
                          isCurrent
                            ? "tw-bg-amber-500/10 dark:tw-bg-amber-500/20 tw-border tw-border-amber-400 dark:tw-border-amber-600"
                            : "hover:tw-bg-gray-50 dark:hover:tw-bg-gray-750 tw-border tw-border-transparent"
                        }`}
                      >
                        <div className="tw-flex tw-items-center tw-gap-3 tw-min-w-0">
                          <span
                            className={`tw-text-xs tw-font-bold tw-w-6 tw-text-center ${
                              isCurrent
                                ? "tw-text-amber-600 dark:tw-text-amber-400"
                                : "tw-text-gray-400"
                            }`}
                          >
                            {isCurrent ? "▶" : idx + 1}
                          </span>
                          <div className="tw-min-w-0">
                            <p
                              className={`tw-text-sm tw-font-bold tw-truncate ${
                                isCurrent
                                  ? "tw-text-amber-600 dark:tw-text-amber-400"
                                  : "tw-text-gray-800 dark:tw-text-gray-200"
                              }`}
                            >
                              {track.trackname}
                            </p>
                            <p className="tw-text-xs tw-text-gray-500 tw-truncate">
                              {track.artista}
                            </p>
                          </div>
                        </div>

                        <div className="tw-flex tw-items-center tw-gap-2 tw-shrink-0">
                          {itemKey && (
                            <span
                              className={`tw-text-[10px] tw-font-bold tw-px-2 tw-py-0.5 tw-rounded ${getCamelotColor(
                                itemKey.camelotCode
                              )}`}
                            >
                              {itemKey.camelotCode}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCurrent(track);
                            }}
                            className="tw-text-gray-400 hover:tw-text-red-500 tw-p-1.5 tw-rounded-lg hover:tw-bg-gray-100 dark:hover:tw-bg-gray-700 tw-transition-colors"
                            title="Eliminar pista"
                          >
                            <Trash2 className="tw-w-3.5 tw-h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <CustomSnackbar
        isOpen={snackbarOpen}
        message={snackbarMessage}
        onClose={() => setSnackbarOpen(false)}
      />
    </Layout>
  );
}
