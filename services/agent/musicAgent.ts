import {
  getDiscogsReleaseDetails,
  analyzeHarmonicMix,
  getLastFmContext,
  getUserMixtapeTracks,
} from "./tools";

export interface AgentFunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export const MUSIC_AGENT_FUNCTIONS: AgentFunctionDefinition[] = [
  {
    name: "get_discogs_release_info",
    description:
      "Obtiene información oficial y en tiempo real del disco desde la base de datos de Discogs: tracklist completo, año, país, formato/edición (prensaje, color de vinilo, edición limitada), sello discográfico y estadísticas de mercado (precios mínimos, cuántas copias hay en venta, cuántos coleccionistas lo tienen y cuántos lo quieren).",
    parameters: {
      type: "object",
      properties: {
        releaseId: {
          type: "string",
          description: "El ID numérico del release en Discogs si se conoce.",
        },
        artist: {
          type: "string",
          description: "Nombre del artista o grupo musical.",
        },
        album: {
          type: "string",
          description: "Título del disco o álbum.",
        },
      },
    },
  },
  {
    name: "analyze_harmonic_dj_mix",
    description:
      "Herramienta especializada para DJs y mezcla armónica. Analiza compatibilidad de BPM y clave tonal usando la rueda Camelot (ej: 8A, 11B). Además busca y sugiere canciones de la colección/mixtape del usuario que mezclan a la perfección.",
    parameters: {
      type: "object",
      properties: {
        camelotCode: {
          type: "string",
          description: "Código Camelot de la canción base (ejemplo: '8A', '9B', '12A').",
        },
        bpm: {
          type: "number",
          description: "Tempo estimado en BPM (ejemplo: 124, 128).",
        },
      },
    },
  },
  {
    name: "get_artist_bio_and_similar",
    description:
      "Obtiene biografía verificada, etiquetas de género, contexto histórico y artistas recomendados similares desde Last.fm.",
    parameters: {
      type: "object",
      properties: {
        artist: {
          type: "string",
          description: "Nombre del artista.",
        },
        album: {
          type: "string",
          description: "Título del álbum (opcional).",
        },
      },
      required: ["artist"],
    },
  },
  {
    name: "get_user_mixtape",
    description:
      "Lista los temas que el usuario tiene agregados a su Mixtape en Diskogs Plus con su información de BPM y clave musical.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
];

export function buildSystemPrompt(context: {
  artist?: string;
  album?: string;
  discoId?: number | string;
  username?: string;
}) {
  return `Eres "DiscBOT Agent", el asistente de inteligencia artificial musical de Diskogs Plus.
Eres un archivista experto en vinilos, coleccionismo musical y DJ profesional especializado en mezcla armónica (Rueda Camelot).

Tu misión:
1. Proporcionar respuestas precisas, entusiastas y fundamentadas sobre música, artistas y ediciones en vinilo.
2. Usar tus herramientas disponibles (Discogs, Last.fm, Análisis Camelot, Mixtape del usuario) cuando te pregunten sobre datos del disco, tracklist, prensajes, precios, rarezas o cómo mezclar temas como DJ.
3. Si el usuario te pregunta detalles específicos de canciones, ediciones o mezclas, NO inventes datos: invoca tus herramientas.
4. Explica con claridad conceptos para DJs como energía armónica (+1 / -1 en Camelot) o cambio de modo emocional (A/B).
5. Mantén un tono cercano, apasionado por el audio y el coleccionismo en formato físico.

Contexto actual de la conversación:
- Artista actual: ${context.artist || "No especificado"}
- Álbum actual: ${context.album || "No especificado"}
- Discogs Release ID: ${context.discoId || "No especificado"}
- Usuario conectado: ${context.username || "Usuario anónimo"}`;
}

export async function executeMusicAgentTool(
  toolName: string,
  args: any,
  context: { username?: string; discoId?: number | string; artist?: string; album?: string }
): Promise<any> {
  switch (toolName) {
    case "get_discogs_release_info":
      return await getDiscogsReleaseDetails({
        releaseId: args.releaseId || context.discoId,
        artist: args.artist || context.artist,
        album: args.album || context.album,
      });

    case "analyze_harmonic_dj_mix":
      return await analyzeHarmonicMix({
        camelotCode: args.camelotCode,
        bpm: args.bpm,
        username: context.username,
      });

    case "get_artist_bio_and_similar":
      return await getLastFmContext({
        artist: args.artist || context.artist || "",
        album: args.album || context.album,
      });

    case "get_user_mixtape":
      return await getUserMixtapeTracks({
        username: context.username || "",
      });

    default:
      return { error: `Herramienta desconocida: ${toolName}` };
  }
}
