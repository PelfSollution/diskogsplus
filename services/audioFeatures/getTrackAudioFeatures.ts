/**
 * BPM y tonalidad de una tracklist sin depender de Spotify
 * (Spotify retiró /v1/audio-features en noviembre de 2024).
 *
 * Fuentes gratuitas y sin clave:
 * 1. ReccoBeats por álbum: artista → álbumes → pistas → audio-features.
 *    Pocas peticiones por disco y la coincidencia más fiable.
 * 2. ReccoBeats por pista: búsqueda por título filtrando por artista.
 * 3. Deezer: solo BPM, para lo que ReccoBeats no tenga.
 */

export interface TrackAudioFeatures {
  tempo: number | null;
  key: number | null; // 0 = Do ... 11 = Si
  mode: number | null; // 1 = mayor, 0 = menor
  spotifyTrackId: string | null;
  source: "reccobeats" | "deezer";
}

type FeaturesFields = Omit<TrackAudioFeatures, "source">;

const RECCOBEATS_URL = "https://api.reccobeats.com/v1";
const DEEZER_URL = "https://api.deezer.com";
const TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FEATURES_BATCH_SIZE = 40; // límite de ReccoBeats
const PAGE_SIZE = 50;
const MAX_ALBUM_PAGES = 4;
const MAX_ALBUM_CANDIDATES = 3;
const MAX_SEARCH_PAGES = 2;
const MAX_TRACK_CANDIDATES = 5;

const cache = new Map<string, { value: unknown; expiresAt: number }>();

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;
  const value = await fn();
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

async function fetchJSON(url: string): Promise<any | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Minúsculas, sin acentos, sin paréntesis/corchetes, sin "the" inicial ni puntuación. */
export function normalizeForMatch(str: string): string {
  return (str || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(/ - .*$/, " ") // "One More Time - Radio Edit"
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/^the /, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titlesMatch(a: string, b: string): boolean {
  const na = normalizeForMatch(a);
  const nb = normalizeForMatch(b);
  return Boolean(na && nb && na === nb);
}

function artistsMatch(candidates: string[], artist: string): boolean {
  const target = normalizeForMatch(artist);
  if (!target) return false;
  return candidates.some((name) => {
    const n = normalizeForMatch(name);
    return Boolean(n) && (n === target || n.includes(target) || target.includes(n));
  });
}

function spotifyIdFromHref(href: unknown): string | null {
  if (typeof href !== "string") return null;
  const match = href.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/);
  return match ? match[1] : null;
}

function toFeatures(f: any): FeaturesFields | null {
  if (!f || typeof f.tempo !== "number" || f.tempo <= 0) return null;
  return {
    tempo: f.tempo,
    key: typeof f.key === "number" && f.key >= 0 ? f.key : null,
    mode: typeof f.mode === "number" ? f.mode : null,
    spotifyTrackId: spotifyIdFromHref(f.href),
  };
}

async function fetchAllPages(baseUrl: string, maxPages: number): Promise<any[]> {
  const items: any[] = [];
  for (let page = 0; page < maxPages; page++) {
    const sep = baseUrl.includes("?") ? "&" : "?";
    const data = await fetchJSON(`${baseUrl}${sep}size=${PAGE_SIZE}&page=${page}`);
    const content: any[] = Array.isArray(data?.content) ? data.content : [];
    items.push(...content);
    if (content.length < PAGE_SIZE || page + 1 >= (data?.totalPages ?? 0)) break;
  }
  return items;
}

/** audio-features en lotes de 40. Devuelve un mapa id → features. */
async function fetchFeaturesByIds(ids: string[]): Promise<Map<string, FeaturesFields>> {
  const result = new Map<string, FeaturesFields>();
  for (let i = 0; i < ids.length; i += FEATURES_BATCH_SIZE) {
    const batch = ids.slice(i, i + FEATURES_BATCH_SIZE);
    const data = await fetchJSON(`${RECCOBEATS_URL}/audio-features?ids=${batch.join(",")}`);
    const items: any[] = Array.isArray(data?.content) ? data.content : [];
    for (const item of items) {
      const features = toFeatures(item);
      if (item?.id && features) result.set(item.id, features);
    }
  }
  return result;
}

// ---------- 1. Estrategia por álbum ----------

async function findReccoBeatsArtistId(artist: string): Promise<string | null> {
  return cached(`artist:${normalizeForMatch(artist)}`, async () => {
    const data = await fetchJSON(
      `${RECCOBEATS_URL}/artist/search?searchText=${encodeURIComponent(artist)}&size=10`
    );
    const results: any[] = Array.isArray(data?.content) ? data.content : [];
    const target = normalizeForMatch(artist);
    return results.find((a) => normalizeForMatch(a?.name) === target)?.id ?? null;
  });
}

async function getAlbumTracks(albumId: string): Promise<any[]> {
  return cached(`album-tracks:${albumId}`, () =>
    fetchAllPages(`${RECCOBEATS_URL}/album/${albumId}/track`, 2)
  );
}

/**
 * Busca el álbum del artista que mejor cubre la tracklist de Discogs y
 * devuelve un mapa índice de pista → id de ReccoBeats.
 */
async function matchTracklistViaAlbum(
  titles: string[],
  artist: string,
  albumTitle: string
): Promise<Map<number, string>> {
  const best = new Map<number, string>();
  const artistId = await findReccoBeatsArtistId(artist);
  if (!artistId) return best;

  const albums = await cached(`artist-albums:${artistId}`, () =>
    fetchAllPages(`${RECCOBEATS_URL}/artist/${artistId}/album`, MAX_ALBUM_PAGES)
  );
  const targetAlbum = normalizeForMatch(albumTitle);
  const candidates = albums
    .filter((a) => normalizeForMatch(a?.name) === targetAlbum)
    // Priorizar álbumes sobre singles/recopilatorios
    .sort((a, b) => Number(b?.albumType === "album") - Number(a?.albumType === "album"))
    .slice(0, MAX_ALBUM_CANDIDATES);

  for (const album of candidates) {
    const tracks = await getAlbumTracks(album.id);
    const matched = new Map<number, string>();
    titles.forEach((title, index) => {
      const track = tracks.find((t) => titlesMatch(t?.trackTitle, title));
      if (track?.id) matched.set(index, track.id);
    });
    if (matched.size > best.size) {
      best.clear();
      matched.forEach((id, index) => best.set(index, id));
    }
    if (best.size === titles.length) break;
  }
  return best;
}

// ---------- 2. Estrategia por pista ----------

async function fromReccoBeatsSearch(title: string, artist: string): Promise<FeaturesFields | null> {
  const cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, " ").replace(/\s+/g, " ").trim();
  const results = await fetchAllPages(
    `${RECCOBEATS_URL}/track/search?searchText=${encodeURIComponent(cleanTitle)}`,
    MAX_SEARCH_PAGES
  );

  const candidateIds = results
    .filter(
      (t) =>
        titlesMatch(t?.trackTitle, title) &&
        artistsMatch((t?.artists || []).map((a: any) => a?.name || ""), artist)
    )
    .slice(0, MAX_TRACK_CANDIDATES)
    .map((t) => t.id)
    .filter(Boolean);

  if (candidateIds.length === 0) return null;

  const features = await fetchFeaturesByIds(candidateIds);
  // Respetar el orden de relevancia de la búsqueda
  for (const id of candidateIds) {
    const f = features.get(id);
    if (f) return f;
  }
  return null;
}

// ---------- 3. Respaldo Deezer (solo BPM) ----------

async function fromDeezer(title: string, artist: string): Promise<FeaturesFields | null> {
  const search = await fetchJSON(
    `${DEEZER_URL}/search?q=${encodeURIComponent(`${artist} ${title}`)}&limit=10`
  );
  const results: any[] = Array.isArray(search?.data) ? search.data : [];
  const match = results.find(
    (t) => titlesMatch(t?.title, title) && artistsMatch([t?.artist?.name || ""], artist)
  );
  if (!match?.id) return null;

  // El BPM solo viene en el detalle de la pista; 0 significa "desconocido"
  const track = await fetchJSON(`${DEEZER_URL}/track/${match.id}`);
  if (!track || typeof track.bpm !== "number" || track.bpm <= 0) return null;

  return { tempo: track.bpm, key: null, mode: null, spotifyTrackId: null };
}

export async function getTrackAudioFeatures(
  title: string,
  artist: string
): Promise<TrackAudioFeatures | null> {
  if (!title || !artist) return null;

  return cached(`track:${normalizeForMatch(artist)}|${normalizeForMatch(title)}`, async () => {
    try {
      const recco = await fromReccoBeatsSearch(title, artist);
      if (recco) return { ...recco, source: "reccobeats" as const };
      const deezer = await fromDeezer(title, artist);
      if (deezer) return { ...deezer, source: "deezer" as const };
    } catch (err: any) {
      console.warn("[AudioFeatures] Aviso:", err?.message);
    }
    return null;
  });
}

/**
 * Enriquece una tracklist de Discogs con tempo/key/mode. Primero intenta
 * resolver el álbum entero en ReccoBeats; las pistas que falten se buscan
 * una a una con concurrencia limitada. Las pistas sin datos quedan igual.
 */
export async function enrichTracklistWithAudioFeatures<
  T extends { title: string; artist?: string }
>(
  tracklist: T[],
  albumArtist: string,
  albumTitle: string,
  concurrency = 4
): Promise<(T & Partial<FeaturesFields>)[]> {
  const result: (T & Partial<FeaturesFields>)[] = [...tracklist];
  const resolved = new Set<number>();

  // 1. Por álbum (solo pistas del artista principal; en recopilatorios no aplica)
  const albumTrackIndexes = tracklist
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => !t.artist || artistsMatch([t.artist], albumArtist));

  if (albumArtist && albumTitle && albumTrackIndexes.length > 0) {
    try {
      const matches = await matchTracklistViaAlbum(
        albumTrackIndexes.map(({ t }) => t.title),
        albumArtist,
        albumTitle
      );
      const features = await fetchFeaturesByIds(Array.from(new Set(matches.values())));
      matches.forEach((reccoId, localIndex) => {
        const f = features.get(reccoId);
        if (!f) return;
        const index = albumTrackIndexes[localIndex].i;
        result[index] = { ...tracklist[index], ...f };
        resolved.add(index);
      });
    } catch (err: any) {
      console.warn("[AudioFeatures] Aviso en búsqueda por álbum:", err?.message);
    }
  }

  // 2. Pista a pista para lo que falte
  const pending = tracklist.map((_, i) => i).filter((i) => !resolved.has(i));
  let next = 0;

  async function worker() {
    while (next < pending.length) {
      const index = pending[next++];
      const track = tracklist[index];
      const features = await getTrackAudioFeatures(track.title, track.artist || albumArtist);
      if (features) {
        const { source, ...fields } = features;
        result[index] = { ...track, ...fields };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, worker));
  return result;
}
