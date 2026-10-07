import { getKeyNotation } from "@/lib/musicNotation";
import getMixtape from "@/services/supabase/getMixtape";
import { fetchArtistInfo, fetchLastfmData, fetchSimilarArtists } from "@/services/last.fm/fetchData";

interface DiscogsHeaders {
  [key: string]: string | undefined;
  "User-Agent": string;
  Authorization?: string;
}

function getDiscogsHeaders(): DiscogsHeaders {
  const headers: DiscogsHeaders = {
    "User-Agent": "DiskogsPlus/2.0 (musical-agent-assistant; +https://diskogsplus.local)",
  };

  const key = process.env.CONSUMER_KEY;
  const secret = process.env.CONSUMER_SECRET;
  if (key && secret) {
    headers.Authorization = `Discogs key=${key}, secret=${secret}`;
  }

  return headers;
}

/**
 * Tool 1: Obtiene información enriquecida del lanzamiento en Discogs (tracklist, pressing, año, precios y estadísticas).
 */
export async function getDiscogsReleaseDetails(params: {
  releaseId?: string | number;
  artist?: string;
  album?: string;
}) {
  try {
    let releaseId = params.releaseId;

    // Si no tenemos releaseId pero sí artista y álbum, buscamos en Discogs
    if (!releaseId && params.artist && params.album) {
      const query = encodeURIComponent(`${params.artist} ${params.album}`);
      const searchUrl = `https://api.discogs.com/database/search?q=${query}&type=release&per_page=1`;
      const searchRes = await fetch(searchUrl, {
        headers: getDiscogsHeaders() as HeadersInit,
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.results && searchData.results.length > 0) {
          releaseId = searchData.results[0].id;
        }
      }
    }

    if (!releaseId) {
      return {
        error: "No se proporcionó un ID de lanzamiento válido ni se pudo encontrar por nombre.",
      };
    }

    const releaseUrl = `https://api.discogs.com/releases/${releaseId}`;
    const res = await fetch(releaseUrl, {
      headers: getDiscogsHeaders() as HeadersInit,
    });

    if (!res.ok) {
      return {
        error: `No se pudieron obtener los datos de Discogs (Status: ${res.status})`,
      };
    }

    const data = await res.json();

    const tracklist = Array.isArray(data.tracklist)
      ? data.tracklist.map((t: any) => ({
          position: t.position || "",
          title: t.title || "",
          duration: t.duration || "N/A",
        }))
      : [];

    const formats = Array.isArray(data.formats)
      ? data.formats.map((f: any) => {
          const desc = Array.isArray(f.descriptions) ? f.descriptions.join(", ") : "";
          return `${f.name || "Vinyl"} (${f.qty ? f.qty + "x" : ""}${desc})`;
        }).join(" / ")
      : "Desconocido";

    const labels = Array.isArray(data.labels)
      ? data.labels.map((l: any) => `${l.name} (${l.catno})`).join(", ")
      : "Desconocido";

    return {
      releaseId: data.id,
      title: data.title,
      artists: Array.isArray(data.artists) ? data.artists.map((a: any) => a.name).join(", ") : "",
      year: data.year || data.released || "Desconocido",
      country: data.country || "Desconocido",
      format: formats,
      labels,
      genres: data.genres || [],
      styles: data.styles || [],
      marketplace: {
        lowestPrice: data.lowest_price !== undefined ? `${data.lowest_price} USD` : "No disponible",
        numForSale: data.num_for_sale || 0,
      },
      community: {
        have: data.community?.have || 0,
        want: data.community?.want || 0,
        ratingAverage: data.community?.rating?.average || 0,
        ratingCount: data.community?.rating?.count || 0,
      },
      tracklist,
      notes: data.notes ? data.notes.slice(0, 500) : "Sin notas adicionales",
    };
  } catch (error: any) {
    return {
      error: `Error al consultar la API de Discogs: ${error.message}`,
    };
  }
}

/**
 * Helper para calcular transiciones armónicas en la Rueda Camelot
 */
function getAdjacentCamelotCodes(code: string): {
  exact: string;
  smoothUp: string;
  smoothDown: string;
  relative: string;
  energyBoost: string;
} {
  const match = code.trim().toUpperCase().match(/^(\d{1,2})([AB])$/);
  if (!match) {
    return { exact: code, smoothUp: code, smoothDown: code, relative: code, energyBoost: code };
  }

  const num = parseInt(match[1], 10);
  const letter = match[2]; // 'A' (minor) o 'B' (major)

  const wrapHour = (n: number) => {
    if (n > 12) return n - 12;
    if (n < 1) return n + 12;
    return n;
  };

  const smoothUp = `${wrapHour(num + 1)}${letter}`;
  const smoothDown = `${wrapHour(num - 1)}${letter}`;
  const relative = `${num}${letter === "A" ? "B" : "A"}`;
  const energyBoost = `${wrapHour(num + 2)}${letter}`;

  return {
    exact: `${num}${letter}`,
    smoothUp,
    smoothDown,
    relative,
    energyBoost,
  };
}

/**
 * Tool 2: Análisis DJ armónico (Camelot Wheel y BPM) con sugerencias de la colección.
 */
export async function analyzeHarmonicMix(params: {
  camelotCode?: string;
  key?: number;
  mode?: number;
  bpm?: number;
  username?: string;
}) {
  let code = params.camelotCode;

  if (!code && params.key !== undefined && params.mode !== undefined) {
    const notationObj = getKeyNotation(params.key, params.mode);
    const codeMatch = notationObj.notation.match(/\((.*?)\)/);
    if (codeMatch && codeMatch[1] && codeMatch[1] !== "N/A") {
      code = codeMatch[1];
    }
  }

  if (!code) {
    return {
      error: "No se proporcionó un código Camelot válido (ej: '8A', '11B') ni combinación de clave/modo.",
    };
  }

  const transitions = getAdjacentCamelotCodes(code);
  const targetBpm = params.bpm || null;

  let compatibleMixtapeTracks: any[] = [];

  // Si tenemos el usuario, buscamos canciones en su Mixtape de Supabase
  if (params.username) {
    try {
      const userMixtape = await getMixtape(params.username);
      if (Array.isArray(userMixtape)) {
        compatibleMixtapeTracks = userMixtape
          .map((track) => {
            let trackCamelot = "N/A";
            if (track.key !== undefined && track.key !== null && track.mode !== undefined && track.mode !== null) {
              const not = getKeyNotation(track.key, track.mode);
              const m = not.notation.match(/\((.*?)\)/);
              if (m && m[1]) trackCamelot = m[1];
            }

            const trackBpm = track.tempo ? Math.round(track.tempo) : null;
            let bpmDifference = null;
            if (targetBpm && trackBpm) {
              bpmDifference = Math.abs(trackBpm - targetBpm);
            }

            const isHarmonicMatch =
              trackCamelot === transitions.exact ||
              trackCamelot === transitions.smoothUp ||
              trackCamelot === transitions.smoothDown ||
              trackCamelot === transitions.relative ||
              trackCamelot === transitions.energyBoost;

            const isBpmCompatible = bpmDifference === null || bpmDifference <= 6;

            return {
              id: track.id,
              artista: track.artista,
              trackname: track.trackname,
              tempo: trackBpm,
              camelot: trackCamelot,
              isHarmonicMatch,
              isBpmCompatible,
              bpmDifference,
            };
          })
          .filter((t) => t.isHarmonicMatch && t.isBpmCompatible)
          .slice(0, 5);
      }
    } catch (err) {
      console.warn("No se pudieron cargar pistas del mixtape para análisis armónico:", err);
    }
  }

  return {
    sourceKey: code,
    sourceBpm: targetBpm,
    harmonicRules: {
      sameKey: {
        code: transitions.exact,
        description: "Misma tonalidad: Mezcla armónica perfecta, mantiene la energía constante sin tensión.",
      },
      smoothEnergyUp: {
        code: transitions.smoothUp,
        description: "+1 en la rueda: Sube gradualmente la energía en la pista de baile.",
      },
      smoothEnergyDown: {
        code: transitions.smoothDown,
        description: "-1 en la rueda: Baja suavemente la intensidad o prepara una transición melódica.",
      },
      relativeMode: {
        code: transitions.relative,
        description: "Cambio de modo (Mayor <-> Menor): Mantiene las mismas notas pero cambia el tono emocional (de oscuro a brillante o viceversa).",
      },
      energyBoost: {
        code: transitions.energyBoost,
        description: "+2 en la rueda (Energy Boost): Salto de energía evidente y eufórico.",
      },
    },
    recommendedBpmRange: targetBpm
      ? `${Math.round(targetBpm - 5)} - ${Math.round(targetBpm + 5)} BPM (±4%)`
      : "Rango estándar: ±4% del tempo de la pista original",
    matchingTracksFromUserCollection: compatibleMixtapeTracks,
  };
}

/**
 * Tool 3: Consulta información biográfica, estilo y artistas similares en Last.fm.
 */
export async function getLastFmContext(params: { artist: string; album?: string }) {
  try {
    const [artistInfo, similarArtists, albumInfo] = await Promise.allSettled([
      fetchArtistInfo(params.artist),
      fetchSimilarArtists(params.artist, 5),
      params.album ? fetchLastfmData(params.album, params.artist) : Promise.resolve(null),
    ]);

    const artistData = artistInfo.status === "fulfilled" ? artistInfo.value?.artist : null;
    const similarData =
      similarArtists.status === "fulfilled"
        ? similarArtists.value?.similarartists?.artist?.map((a: any) => a.name)
        : [];
    const albumData = albumInfo.status === "fulfilled" ? albumInfo.value?.album : null;

    let bioSummary = "No disponible";
    if (artistData?.bio?.summary) {
      // Limpiar enlaces HTML que suele devolver Last.fm en la bio
      bioSummary = artistData.bio.summary.replace(/<a\b[^>]*>(.*?)<\/a>/gi, "").trim();
    }

    const tags = Array.isArray(artistData?.tags?.tag)
      ? artistData.tags.tag.map((t: any) => t.name)
      : [];

    return {
      artist: params.artist,
      bio: bioSummary,
      tags,
      similarArtists: similarData || [],
      albumListeners: albumData?.listeners || null,
      albumPlaycount: albumData?.playcount || null,
    };
  } catch (error: any) {
    return {
      error: `Error al consultar Last.fm: ${error.message}`,
    };
  }
}

/**
 * Tool 4: Obtiene las pistas guardadas en el mixtape del usuario.
 */
export async function getUserMixtapeTracks(params: { username: string }) {
  try {
    if (!params.username) {
      return { error: "Se requiere nombre de usuario para consultar el mixtape." };
    }
    const tracks = await getMixtape(params.username);
    if (!tracks || tracks.length === 0) {
      return { message: "El usuario no tiene pistas en su mixtape actualmente." };
    }
    return {
      total: tracks.length,
      tracks: tracks.map((t: any) => {
        let camelot = "N/A";
        if (t.key !== undefined && t.mode !== undefined) {
          const n = getKeyNotation(t.key, t.mode);
          const m = n.notation.match(/\((.*?)\)/);
          if (m && m[1]) camelot = m[1];
        }
        return {
          id: t.id,
          artista: t.artista,
          trackname: t.trackname,
          bpm: t.tempo ? Math.round(t.tempo) : null,
          camelot,
        };
      }),
    };
  } catch (err: any) {
    return { error: `Error al leer mixtape: ${err.message}` };
  }
}
