import {
  getDiscogsReleaseDetails,
  analyzeHarmonicMix,
  getLastFmContext,
  getUserMixtapeTracks,
} from "./tools";
import { buildSession, saveSessionAsMixtape } from "./sessionBuilder";
import { tool } from "ai";
import { z } from "zod";

export interface MusicAgentContext {
  username?: string;
  discoId?: number | string;
  artist?: string;
  album?: string;
  /** Mixtape con la que se trabaja (ya comprobada); sin ella, todas las del usuario */
  mixtapeId?: number;
  mixtapeName?: string;
  /** Tokens OAuth de Discogs para leer la colección (nunca van al prompt) */
  accessData?: unknown;
}

/**
 * Herramientas de DiscBOT para la AI SDK. Los valores que el modelo no
 * indique se completan con el contexto del disco y del usuario.
 */
export function buildMusicAgentTools(context: MusicAgentContext) {
  return {
    get_discogs_release_info: tool({
      description:
        "Obtiene información oficial y en tiempo real del disco desde la base de datos de Discogs: tracklist completo, año, país, formato/edición (prensaje, color de vinilo, edición limitada), sello discográfico y estadísticas de mercado (precios mínimos, cuántas copias hay en venta, cuántos coleccionistas lo tienen y cuántos lo quieren).",
      inputSchema: z.object({
        releaseId: z.string().optional().describe("El ID numérico del release en Discogs si se conoce."),
        artist: z.string().optional().describe("Nombre del artista o grupo musical."),
        album: z.string().optional().describe("Título del disco o álbum."),
      }),
      execute: async (args) =>
        getDiscogsReleaseDetails({
          releaseId: args.releaseId || context.discoId,
          artist: args.artist || context.artist,
          album: args.album || context.album,
        }),
    }),

    analyze_harmonic_dj_mix: tool({
      description:
        "Herramienta especializada para DJs y mezcla armónica. Analiza compatibilidad de BPM y clave tonal usando la rueda Camelot (ej: 8A, 11B). Además busca y sugiere canciones de la colección/mixtape del usuario que mezclan a la perfección.",
      inputSchema: z.object({
        camelotCode: z.string().optional().describe("Código Camelot de la canción base (ejemplo: '8A', '9B', '12A')."),
        bpm: z.number().optional().describe("Tempo estimado en BPM (ejemplo: 124, 128)."),
      }),
      execute: async (args) =>
        analyzeHarmonicMix({
          camelotCode: args.camelotCode,
          bpm: args.bpm,
          username: context.username,
          mixtapeId: context.mixtapeId,
        }),
    }),

    get_artist_bio_and_similar: tool({
      description:
        "Obtiene biografía verificada, etiquetas de género, contexto histórico y artistas recomendados similares desde Last.fm.",
      inputSchema: z.object({
        artist: z.string().describe("Nombre del artista."),
        album: z.string().optional().describe("Título del álbum (opcional)."),
      }),
      execute: async (args) =>
        getLastFmContext({
          artist: args.artist || context.artist || "",
          album: args.album || context.album,
        }),
    }),

    get_user_mixtape: tool({
      description:
        "Lista los temas de la mixtape actual del usuario en Diskogs Plus, en el orden de la sesión, con su BPM, su código Camelot, su duración y su posición en el vinilo (A1, B2). Pistas seguidas con el mismo disco_id no se pueden mezclar con una sola copia. Sin mixtape actual, lista los de todas sus mixtapes.",
      inputSchema: z.object({}),
      execute: async () =>
        getUserMixtapeTracks({
          username: context.username || "",
          mixtapeId: context.mixtapeId,
          mixtapeName: context.mixtapeName,
        }),
    }),

    build_session: tool({
      description:
        "Propone una sesión de DJ con los vinilos de la colección de Discogs del usuario: filtra por género o estilo, busca BPM y tonalidad de las pistas, se queda con el rango de BPM pedido, las ordena por armonía (Camelot) y BPM y corta en la duración pedida. Acepta medio tiempo o doble tiempo y un BPM suelto («a 120») se busca con ±4. Revisa discos al azar por tandas, hasta 30. No guarda nada. Si no hay pistas en el rango, devuelve las más cercanas: ofrécelas o propón otro rango, y explica que muchas ediciones pequeñas no tienen BPM en las bases de datos.",
      inputSchema: z.object({
        durationMinutes: z.number().optional().describe("Duración de la sesión en minutos (por defecto 60)."),
        bpmMin: z.number().optional().describe("BPM mínimo (ej: 95)."),
        bpmMax: z.number().optional().describe("BPM máximo (ej: 110)."),
        genre: z
          .string()
          .optional()
          .describe("Género o estilo tal como lo nombra Discogs, en inglés: 'Soul', 'Funk', 'Jazz', 'House', 'Disco'. Varios separados por comas."),
      }),
      execute: async (args) => buildSession(context.username || "", context.accessData, args),
    }),

    save_session_as_mixtape: tool({
      description:
        "Guarda la última sesión propuesta con build_session como una mixtape nueva del usuario, en el mismo orden. Úsala SOLO cuando el usuario haya confirmado expresamente que quiere guardarla.",
      inputSchema: z.object({
        nombre: z.string().describe("Nombre de la mixtape nueva (ej: 'Soul 95–110 BPM')."),
      }),
      execute: async (args) => saveSessionAsMixtape(context.username || "", args.nombre),
    }),
  };
}

export function buildSystemPrompt(context: MusicAgentContext) {
  return `Eres "DiscBOT Agent", el asistente de inteligencia artificial musical de Diskogs Plus.
Eres un archivista experto en vinilos, coleccionismo musical y DJ profesional especializado en mezcla armónica (Rueda Camelot).

Tu misión:
1. Proporcionar respuestas precisas y fundamentadas sobre música, artistas y ediciones en vinilo.
2. Usar tus herramientas disponibles (Discogs, Last.fm, Análisis Camelot, Mixtape del usuario) cuando te pregunten sobre datos del disco, tracklist, prensajes, precios, rarezas o cómo mezclar temas como DJ.
3. Si el usuario te pregunta detalles específicos de canciones, ediciones o mezclas, NO inventes datos: invoca tus herramientas.
4. Explica con claridad conceptos para DJs como energía armónica (+1 / -1 en Camelot) o cambio de modo emocional (A/B).
5. Si te piden montar una sesión o un set con sus discos, usa build_session. Presenta la lista en orden con BPM, Camelot y cara del vinilo (A1, B2), avisa de las pistas seguidas del mismo disco y pregunta si quiere guardarla como mixtape. Solo llama a save_session_as_mixtape cuando diga que sí.
6. Tono cercano pero sobrio, como un dependiente de tienda de discos que sabe mucho: ve al grano, sin saludos ni exclamaciones de relleno («¡Excelente elección!»). Respuestas breves; usa listas y **negrita** para datos (BPM, Camelot, cara) cuando ayuden a leer.

Contexto actual de la conversación:
- Artista actual: ${context.artist || "No especificado"}
- Álbum actual: ${context.album || "No especificado"}
- Discogs Release ID: ${context.discoId || "No especificado"}
- Usuario conectado: ${context.username || "Usuario anónimo"}
- Mixtape actual: ${context.mixtapeName ? `«${context.mixtapeName}» (las herramientas de mixtape solo leen esta)` : "ninguna (las herramientas leen todas las mixtapes del usuario)"}`;
}
