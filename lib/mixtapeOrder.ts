import { getPitchClassNotation } from "./musicNotation";

type OrderableTrack = {
  tempo?: number | null;
  key?: number | null;
  mode?: number | null;
};

type Camelot = { number: number; letter: string };

function getCamelot(track: OrderableTrack): Camelot | null {
  if (typeof track.key !== "number" || typeof track.mode !== "number") return null;
  const match = getPitchClassNotation(track.key, track.mode).camelotCode.match(/^(\d+)([AB])$/);
  return match ? { number: Number(match[1]), letter: match[2] } : null;
}

function getTempo(track: OrderableTrack): number | null {
  return typeof track.tempo === "number" && track.tempo > 0 ? track.tempo : null;
}

/**
 * Pasos en la rueda Camelot: 0 = misma tonalidad; 1 = vecina compatible
 * (±1 en la rueda o cambio mayor/menor con el mismo número).
 */
export function camelotDistance(a: Camelot, b: Camelot): number {
  const diff = Math.abs(a.number - b.number);
  return Math.min(diff, 12 - diff) + (a.letter === b.letter ? 0 : 1);
}

/** Coste de pasar de una pista a otra: cuanto menor, mejor transición. */
function transitionCost(from: OrderableTrack, to: OrderableTrack): number {
  const a = getCamelot(from);
  const b = getCamelot(to);
  const steps = a && b ? camelotDistance(a, b) : 3;
  // Las transiciones compatibles (0–1 pasos) casi no penalizan; el resto, mucho
  const harmonic = steps <= 1 ? steps * 2 : steps * 8;

  const fromTempo = getTempo(from);
  const toTempo = getTempo(to);
  if (fromTempo === null || toTempo === null) return harmonic + 8;

  const delta = toTempo - fromTempo;
  // Se prefiere ir subiendo de BPM a lo largo de la sesión
  return harmonic + (delta >= 0 ? delta : Math.abs(delta) * 1.5);
}

/**
 * Ordena una sesión por armonía (rueda Camelot) y BPM: empieza por la pista
 * más lenta y elige cada vez la siguiente con la transición más suave.
 * Las pistas sin BPM ni tonalidad van al final, en su orden actual.
 */
export function sortByHarmonyAndBpm<T extends OrderableTrack>(tracks: T[]): T[] {
  const analysed = tracks.filter((t) => getCamelot(t) || getTempo(t) !== null);
  const rest = tracks.filter((t) => !getCamelot(t) && getTempo(t) === null);
  if (analysed.length === 0) return [...tracks];

  const pending = [...analysed];
  const startIndex = pending.reduce(
    (best, t, i) => ((getTempo(t) ?? Infinity) < (getTempo(pending[best]) ?? Infinity) ? i : best),
    0
  );
  const ordered = pending.splice(startIndex, 1);

  while (pending.length > 0) {
    const last = ordered[ordered.length - 1];
    let bestIndex = 0;
    let bestCost = Infinity;
    pending.forEach((t, i) => {
      const cost = transitionCost(last, t);
      if (cost < bestCost) {
        bestCost = cost;
        bestIndex = i;
      }
    });
    ordered.push(...pending.splice(bestIndex, 1));
  }

  return [...ordered, ...rest];
}
