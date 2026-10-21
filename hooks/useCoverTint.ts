import { useEffect, useState } from "react";

/** Mezcla un color RGB con blanco: k = 0 deja el color, k = 1 da blanco. */
function mixWithWhite([r, g, b]: number[], k: number): string {
  return `rgb(${[r, g, b].map((v) => Math.round(v + (255 - v) * k)).join(" ")})`;
}

/**
 * Tinte muy claro sacado de la portada (color medio de la imagen), para el
 * fondo de la cabecera de la ficha del disco (docs/design.md §2). La imagen
 * pasa por /_next/image para leerla desde el mismo origen; si falla, null.
 */
export default function useCoverTint(coverUrl?: string | null): string | null {
  const [tint, setTint] = useState<{ url: string; color: string } | null>(null);

  useEffect(() => {
    if (!coverUrl || !coverUrl.startsWith("https://")) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 16;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 16, 16);
        const data = ctx.getImageData(0, 0, 16, 16).data;
        const sum = [0, 0, 0];
        for (let i = 0; i < data.length; i += 4) {
          sum[0] += data[i];
          sum[1] += data[i + 1];
          sum[2] += data[i + 2];
        }
        const pixels = data.length / 4;
        const average = sum.map((v) => v / pixels);
        if (!cancelled) setTint({ url: coverUrl, color: mixWithWhite(average, 0.8) });
      } catch {
        // Lienzo bloqueado o imagen no válida: sin tinte
      }
    };
    img.src = `/_next/image?url=${encodeURIComponent(coverUrl)}&w=64&q=50`;
    return () => {
      cancelled = true;
    };
  }, [coverUrl]);

  return tint && tint.url === coverUrl ? tint.color : null;
}
