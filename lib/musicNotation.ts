export const CAMELOT_CODES: { [key: string]: string } = {
  "C major": "8B",
  "A minor": "8A",
  "G major": "9B",
  "E minor": "9A",
  "D major": "10B",
  "B minor": "10A",
  "A major": "11B",
  "F♯/G♭ minor": "11A",
  "E major": "12B",
  "C♯/D♭ minor": "12A",
  "B major": "1B",
  "G♯/A♭ minor": "1A",
  "F♯/G♭ major": "2B",
  "D♯/E♭ minor": "2A",
  "C♯/D♭ major": "3B",
  "A♯/B♭ minor": "3A",
  "F major": "4B",
  "D minor": "4A",
  "A♯/B♭ major": "5B",
  "G minor": "5A",
  "G♯/A♭ major": "6B",
  "F minor": "6A",
  "D♯/E♭ major": "7B",
  "C minor": "7A",
};

export const PITCH_CLASS_COLORS: { [key: string]: string } = {
  "1A": "tw-bg-teal-600",
  "1B": "tw-bg-teal-500",
  "2A": "tw-bg-emerald-600",
  "2B": "tw-bg-emerald-500",
  "3A": "tw-bg-green-600",
  "3B": "tw-bg-green-500",
  "4A": "tw-bg-lime-600",
  "4B": "tw-bg-lime-500",
  "5A": "tw-bg-yellow-600",
  "5B": "tw-bg-yellow-500",
  "6A": "tw-bg-amber-600",
  "6B": "tw-bg-amber-500",
  "7A": "tw-bg-orange-600",
  "7B": "tw-bg-orange-500",
  "8A": "tw-bg-red-600",
  "8B": "tw-bg-red-500",
  "9A": "tw-bg-rose-600",
  "9B": "tw-bg-rose-500",
  "10A": "tw-bg-pink-600",
  "10B": "tw-bg-pink-500",
  "11A": "tw-bg-purple-600",
  "11B": "tw-bg-purple-500",
  "12A": "tw-bg-indigo-600",
  "12B": "tw-bg-indigo-500",
};

export const PITCH_CLASSES = [
  "C",
  "C♯/D♭",
  "D",
  "D♯/E♭",
  "E",
  "F",
  "F♯/G♭",
  "G",
  "G♯/A♭",
  "A",
  "A♯/B♭",
  "B",
];

/** Fondo de la etiqueta Camelot (con texto blanco para que se lea en todos los tonos) */
export function getCamelotColor(camelotCode?: string): string {
  const bg = (camelotCode && PITCH_CLASS_COLORS[camelotCode]) || "tw-bg-gray-500";
  return `${bg} tw-text-white`;
}

export function getPitchClassNotation(key: number, modeNumber: number) {
  const mode = modeNumber === 1 ? "major" : "minor";
  const note = PITCH_CLASSES[key] || "N/A";
  const lookupKey = `${note} ${mode}`;
  const camelotCode = CAMELOT_CODES[lookupKey] || "N/A";

  return {
    note,
    mode,
    camelotCode,
    full: `${note} (${camelotCode})`,
    color: getCamelotColor(camelotCode),
  };
}

export function getKeyNotation(key: number, modeNumber: number) {
  const result = getPitchClassNotation(key, modeNumber);
  return {
    notation: result.full,
    color: result.color,
  };
}