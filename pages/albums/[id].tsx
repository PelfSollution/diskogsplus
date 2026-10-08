import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import CustomCircularProgress from "@/components/CustomCircularProgress";
import CustomSnackbar from "@/components/CustomSnackbar";
import useGetAlbumInfo, { AlbumInfoInterface } from "@/hooks/useGetAlbumInfo";
import useGetMixtape from "@/hooks/useGetMixtape";
import useGetUserData from "@/hooks/useGetUserData";
import addMixtape from "@/services/supabase/addMixtape";
import deleteFromMixtape from "@/services/supabase/deleteFromMixtape";
import { getArtistImageFromSupabase } from "@/services/supabase/getArtistImageFromSupabase";
import { isAlbumInWantlist } from "@/services/supabase/checkAlbumInWantlist";

import { Disc, AlertCircle, RefreshCw } from "lucide-react";

// Componentes modulares de Álbum
import AlbumCoverFlip from "@/components/album/AlbumCoverFlip";
import AlbumHeader from "@/components/album/AlbumHeader";
import AlbumBioAccordion from "@/components/album/AlbumBioAccordion";
import SimilarArtistsGrid from "@/components/album/SimilarArtistsGrid";
import AlbumTracklist, { TrackItem } from "@/components/album/AlbumTracklist";
import AlbumMediaSidebar from "@/components/album/AlbumMediaSidebar";

function AlbumDetails() {
  const router = useRouter();
  const { id } = router.query;
  const idNumber = Number(id);
  const fromCompare = router.query.from === "compare";

  const { data: userData } = useGetUserData();
  const username = userData?.userProfile?.username || "";

  const {
    data: albumInfo,
    isLoading: albumLoading,
    error: albumError,
    mutate: mutateAlbum,
  } = useGetAlbumInfo(idNumber, Number(router.query.masterId) || 0);

  const [isFlipped, setIsFlipped] = useState(false);
  const [tracksInMixtape, setTracksInMixtape] = useState<string[]>([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [inWantlist, setInWantlist] = useState(false);
  const [wantlistLoading, setWantlistLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [backCoverImage, setBackCoverImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichedInfo, setEnrichedInfo] = useState<string | null>(null);

  const { data: mixtape } = useGetMixtape(username);

  // Cargar estado inicial de mixtape del usuario
  useEffect(() => {
    if (mixtape) {
      setTracksInMixtape(mixtape.map((t: any) => t.trackname));
    }
  }, [mixtape]);

  // Verificar si el álbum está en la Wantlist
  useEffect(() => {
    if (username && idNumber) {
      isAlbumInWantlist(username, idNumber).then((exists) => {
        setInWantlist(exists);
      });
    }
  }, [username, idNumber]);

  // Obtener imagen del artista en Supabase si no hay portada oficial
  useEffect(() => {
    if (albumInfo && !albumInfo.coverImage && albumInfo.artist) {
      getArtistImageFromSupabase(albumInfo.artist).then((img) => {
        if (img) setCoverImage(img);
      });
    }
  }, [albumInfo]);

  const showNotification = (msg: string) => {
    setSnackbarMessage(msg);
    setOpenSnackbar(true);
  };

  // Voltear portada
  const handleFlip = () => {
    if (!isGenerating) {
      setIsFlipped(!isFlipped);
    }
  };

  // Generar portada alternativa con IA
  const handleGenerateImage = async () => {
    if (!albumInfo || isGenerating) return;
    setIsGenerating(true);
    showNotification("Generando arte conceptual con IA...");

    try {
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistName: albumInfo.artist,
          coverType: isFlipped ? "back" : "front",
          title: albumInfo.title,
          username,
        }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        if (isFlipped) {
          setBackCoverImage(data.imageUrl);
        } else {
          setCoverImage(data.imageUrl);
        }
        showNotification("¡Portada generada con éxito!");
      } else {
        showNotification(data?.message || data?.error || "No se pudo generar la imagen.");
      }
    } catch (err) {
      console.error(err);
      showNotification("Error de conexión al generar la imagen.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Enriquecer información del artista con IA
  const handleEnrichArtistInfo = async () => {
    if (!albumInfo || isEnriching) return;
    setIsEnriching(true);

    try {
      const response = await fetch("/api/albums/enrichArtistInfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistName: albumInfo.artist,
          albumName: albumInfo.title,
          discoId: idNumber,
          username,
        }),
      });

      const data = await response.json();
      const resultText = data?.info || data?.enrichedInfo;
      if (resultText) {
        setEnrichedInfo(resultText);
        showNotification("Información enriquecida obtenida con éxito.");
      } else {
        showNotification(data?.message || "No se pudo obtener información adicional.");
      }
    } catch (err) {
      console.error(err);
      showNotification("Error al obtener información adicional.");
    } finally {
      setIsEnriching(false);
    }
  };

  // Gestión de Wantlist
  const handleToggleWantlist = async () => {
    if (!albumInfo || wantlistLoading) return;
    setWantlistLoading(true);

    try {
      if (inWantlist) {
        const res = await fetch("/api/albums/removeFromWantlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, disco_id: idNumber }),
        });
        const data = await res.json();
        if (data.success) {
          setInWantlist(false);
          showNotification("Álbum eliminado de tu Wantlist.");
        }
      } else {
        const res = await fetch("/api/albums/addToWantlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            disco_id: idNumber,
            artista: albumInfo.artist,
            album: albumInfo.title,
            image_url: coverImage || albumInfo.coverImage,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setInWantlist(true);
          showNotification("¡Álbum añadido a tu Wantlist!");
        }
      }
    } catch (err) {
      console.error(err);
      showNotification("Error al actualizar la Wantlist.");
    } finally {
      setWantlistLoading(false);
    }
  };

  // Gestión de pistas en Mixtape
  const isSongInMixtape = (songTitle: string) => {
    return tracksInMixtape.includes(songTitle);
  };

  const handleAddToMixtape = async (track: TrackItem) => {
    try {
      await addMixtape({
        username,
        artista: albumInfo?.artist || "",
        trackname: track.title,
        disco_id: idNumber.toString(),
        spotifytrackid: track.spotifyTrackId || null,
        tempo: track.tempo ?? null,
        key: track.key ?? null,
        mode: track.mode ?? null,
        duration: track.duration ?? null,
      });
      setTracksInMixtape((prev) => [...prev, track.title]);
      showNotification(`"${track.title}" añadida al Mixtape.`);
    } catch (err) {
      console.error(err);
      showNotification("Error al añadir la pista al mixtape.");
    }
  };

  const handleDeleteFromMixtape = async (track: TrackItem) => {
    try {
      await deleteFromMixtape(
        username,
        albumInfo?.artist || "",
        track.title,
        idNumber.toString()
      );
      setTracksInMixtape((prev) => prev.filter((t) => t !== track.title));
      showNotification(`"${track.title}" eliminada del Mixtape.`);
    } catch (err) {
      console.error(err);
      showNotification("Error al eliminar la pista del mixtape.");
    }
  };

  // Navegar al chat de DiscBOT Agent
  const redirectToChat = () => {
    if (!albumInfo) return;
    let url = `/chat?artista=${encodeURIComponent(albumInfo.artist)}&album=${encodeURIComponent(
      albumInfo.title
    )}&disco_id=${idNumber}&username=${encodeURIComponent(username)}`;
    if (fromCompare) {
      url += "&from=compare";
    }
    router.push(url);
  };

  if (albumError) {
    return (
      <Layout centeredContent={true} title="Error al cargar vinilo">
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-min-h-[50vh] tw-text-center tw-p-6">
          <div className="tw-w-16 tw-h-16 tw-bg-red-100 dark:tw-bg-red-950/50 tw-text-red-500 tw-rounded-2xl tw-flex tw-items-center tw-justify-center tw-mb-4">
            <Disc className="tw-w-8 tw-h-8" />
          </div>
          <h2 className="tw-text-xl tw-font-bold tw-text-gray-900 dark:tw-text-white tw-mb-2">
            No se pudo cargar el disco #{idNumber || id}
          </h2>
          <p className="tw-text-sm tw-text-gray-500 tw-max-w-md tw-mb-6">
            No pudimos obtener la información desde Discogs. Es posible que el ID sea inválido o que la API pública esté temporalmente saturada.
          </p>
          <div className="tw-flex tw-gap-3">
            <button
              onClick={() => router.back()}
              className="tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-text-gray-700 dark:tw-text-gray-200 hover:tw-bg-gray-100 dark:hover:tw-bg-gray-800 tw-transition-colors"
            >
              Volver atrás
            </button>
            <button
              onClick={() => mutateAlbum()}
              className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-rounded-xl tw-bg-amber-500 hover:tw-bg-amber-600 tw-text-white tw-transition-colors"
            >
              <RefreshCw className="tw-w-4 tw-h-4" />
              Reintentar
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (albumLoading || !albumInfo) {
    return (
      <Layout centeredContent={true} title="Cargando detalles del vinilo...">
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-min-h-[50vh]">
          <CustomCircularProgress />
          <p className="tw-mt-4 tw-text-sm tw-text-gray-500">
            Cargando detalles del vinilo desde Discogs...
          </p>
        </div>
      </Layout>
    );
  }

  const yearReleased =
    albumInfo.releaseDate && albumInfo.releaseDate !== "0"
      ? albumInfo.releaseDate
      : albumInfo.year;

  return (
    <Layout
      title={`${albumInfo.title} - ${albumInfo.artist} | Diskogs +`}
      description={`Detalles, armonía Camelot y coleccionismo para ${albumInfo.title}`}
      centeredTopContent={true}
    >
      <div className="tw-container tw-mx-auto tw-max-w-6xl tw-p-4 md:tw-p-6">
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-12 tw-gap-6">
          {/* Columna Izquierda: Portada, Datos, Tracklist, Bio y Similares (7 cols) */}
          <div className="lg:tw-col-span-7 tw-space-y-4">
            {/* Header del Álbum con portada interactiva */}
            <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-p-5 tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-sm tw-flex tw-flex-col sm:tw-flex-row tw-gap-5 tw-items-start">
              <AlbumCoverFlip
                coverImage={coverImage || albumInfo.coverImage}
                backCoverImage={backCoverImage || albumInfo.backCoverImage}
                artist={albumInfo.artist}
                title={albumInfo.title}
                isFlipped={isFlipped}
                onFlip={handleFlip}
                isGenerating={isGenerating}
                onGenerateImage={handleGenerateImage}
              />

              <AlbumHeader
                artist={albumInfo.artist}
                title={albumInfo.title}
                year={yearReleased}
                label={albumInfo.label}
                genres={albumInfo.genres}
                lastfmTags={albumInfo.lastfmTags}
                discoId={idNumber}
                onAskChat={redirectToChat}
                fromCompare={fromCompare}
                inWantlist={inWantlist}
                onToggleWantlist={handleToggleWantlist}
                wantlistLoading={wantlistLoading}
              />
            </div>

            {/* Tracklist con BPM y Camelot Wheel */}
            {albumInfo.tracklist && albumInfo.tracklist.length > 0 && (
              <AlbumTracklist
                tracklist={albumInfo.tracklist}
                isSongInMixtape={isSongInMixtape}
                onAddToMixtape={handleAddToMixtape}
                onDeleteFromMixtape={handleDeleteFromMixtape}
              />
            )}

            {/* Biografía de Last.fm e Información enriquecida por IA */}
            <AlbumBioAccordion
              artistBio={albumInfo.artistBio}
              enrichedInfo={enrichedInfo}
              onEnrichArtistInfo={handleEnrichArtistInfo}
              isGenerating={isEnriching}
            />

            {/* Artistas Similares (Last.fm) */}
            {albumInfo.similarArtists && albumInfo.similarArtists.length > 0 && (
              <SimilarArtistsGrid
                artists={albumInfo.similarArtists}
                artistName={albumInfo.artist}
              />
            )}
          </div>

          {/* Columna Derecha: Spotify Embed, Canciones Similares y Vídeos (5 cols) */}
          <div className="lg:tw-col-span-5">
            <div className="tw-sticky tw-top-4">
              <AlbumMediaSidebar
                discoId={idNumber}
                title={albumInfo.title}
                spotifyAlbumId={albumInfo.spotifyAlbumId}
                isPopularAlbum={albumInfo.isPopularAlbum}
                artist={albumInfo.artist}
                similarTracks={albumInfo.similarTracks}
                videos={albumInfo.videos}
              />
            </div>
          </div>
        </div>
      </div>

      <CustomSnackbar
        isOpen={openSnackbar}
        message={snackbarMessage}
        onClose={() => setOpenSnackbar(false)}
      />
    </Layout>
  );
}

export default AlbumDetails;
