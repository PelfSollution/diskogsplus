/**
 * Cara del vinilo a partir de la posición de Discogs: «A1» → «A», «B» → «B».
 * Las posiciones sin cara («1», «CD1-2») devuelven null.
 */
export function vinylSide(position?: string | null): string | null {
  const match = (position || "").trim().match(/^([A-Z]{1,2})\d*[a-z]?$/i);
  return match ? match[1].toUpperCase() : null;
}

/** «3:45» o «1:02:10» → segundos; null si no se entiende. */
export function durationToSeconds(duration?: string | null): number | null {
  const parts = (duration || "").trim().split(":").map(Number);
  if (parts.length < 2 || parts.length > 3 || parts.some((n) => !Number.isFinite(n) || n < 0)) {
    return null;
  }
  return parts.reduce((total, n) => total * 60 + n, 0);
}

/** Segundos → «42 min» o «1 h 05 min». */
export function formatSessionDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min`;
}

type SessionTrack = { disco_id: string; vinyl_position?: string | null };

/**
 * Aviso si la pista va justo después de otra del mismo disco: con una sola
 * copia no se pueden mezclar (y si cambian de cara, hay que darle la vuelta).
 */
export function sameRecordWarning(previous: SessionTrack | undefined, track: SessionTrack): string | null {
  if (!previous || previous.disco_id !== track.disco_id) return null;
  const from = vinylSide(previous.vinyl_position);
  const to = vinylSide(track.vinyl_position);
  const flip = from && to && from !== to ? ` y hay que darle la vuelta (cara ${from} → ${to})` : "";
  return `Mismo disco que la anterior: con una sola copia no se pueden mezclar${flip}.`;
}
