export function getKeyNotation(key: number, modeNumber: number) {
 
    const pitchClasses = [
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

    const mode = modeNumber === 1 ? "major" : "minor";

    const camelotCodes: { [key: string]: string } = {
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
      "B♭ major": "5B",
      "G minor": "5A",
      "A♭ major": "6B",
      "F minor": "6A",
      "E♭ major": "7B",
      "C minor": "7A",
    };

    const pitchClassColors: { [key: string]: string } = {
      "1A": "tw-bg-yellow-200",
      "1B": "tw-bg-yellow-200",
      "2A": "tw-bg-yellow-300",
      "2B": "tw-bg-orange-200",
      "3A": "tw-bg-orange-200",
      "3B": "tw-bg-orange-200",
      "4A": "tw-bg-orange-300",
      "4B": "tw-bg-orange-300",
      "5A": "tw-bg-red-200",
      "5B": "tw-bg-red-200",
      "6A": "tw-bg-rose-200",
      "6B": "tw-bg-rose-200",
      "7A": "tw-bg-pink-200",
      "7B": "tw-bg-pink-200",
      "8A": "tw-bg-purple-200",
      "8B": "tw-bg-purple-200",
      "9A": "tw-bg-blue-200",
      "9B": "tw-bg-blue-200",
      "10A": "tw-bg-cyan-200",
      "10B": "tw-bg-cyan-200",
      "11A": "tw-bg-green-200",
      "11B": "tw-bg-green-200",
      "12A": "tw-bg-green-300",
      "12B": "tw-bg-green-300",
    };

    const notation = pitchClasses[key] || "N/A";

    // Agregamos un log aquí para ver qué se está produciendo para cada pista
   // console.log(`Intentando encontrar: ${notation} ${mode} en 'camelotCodes'`);

    if (!camelotCodes[`${notation} ${mode}`]) {
     /* console.log(
        `La combinación ${notation} ${mode} no se encuentra en 'camelotCodes'`
      );*/
      return {
        notation: `${notation} (N/A)`,
        color: "tw-bg-gray-400",
      };
    }

    const camelotCode = camelotCodes[`${notation} ${mode}`];
    //console.log(`Camelot code encontrado: ${camelotCode}`);

    return {
      notation: `${notation} (${camelotCode})`,
      color: pitchClassColors[camelotCode] || "tw-bg-gray-400",
    };
  }