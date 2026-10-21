import Layout from "@/components/Layout";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, getToolName, isToolUIPart, type UIMessage } from "ai";
import { useRouter } from "next/router";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  BadgeEuro,
  BookOpen,
  Check,
  Disc3,
  Gauge,
  ListMusic,
  Loader2,
  Puzzle,
  Shuffle,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { getChatHistory } from "@/services/client/userData";
import VinylDisc from "@/components/VinylDisc";
import ChatMarkdown from "@/components/chat/ChatMarkdown";

function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

type Suggestion = { icon: LucideIcon; title: string; prompt: string };

const ALBUM_PROMPTS: Suggestion[] = [
  {
    icon: BadgeEuro,
    title: "Valor y rareza",
    prompt: "¿Cuál es el valor actual en el mercado de Discogs de esta edición y cuántas copias hay en venta?",
  },
  {
    icon: Shuffle,
    title: "Mezcla armónica",
    prompt: "¿Cómo puedo mezclar canciones de este disco con la rueda Camelot? ¿Qué transiciones de energía me sugieres?",
  },
  {
    icon: BookOpen,
    title: "Historia y similares",
    prompt: "Cuéntame el contexto histórico y anécdotas de este álbum, y qué otros artistas similares debería escuchar.",
  },
  {
    icon: ListMusic,
    title: "Buscar en mi mixtape",
    prompt: "¿Tengo algún tema en mi mixtape que mezcle armónicamente con este disco?",
  },
];

const MIXTAPE_PROMPTS: Suggestion[] = [
  {
    icon: Gauge,
    title: "Revisar transiciones",
    prompt: "Repasa mi mixtape en orden y dime qué transiciones de tonalidad (Camelot) o de BPM chocan y cómo las arreglarías.",
  },
  {
    icon: TrendingUp,
    title: "Curva de energía",
    prompt: "¿Cómo es la curva de energía de mi mixtape? ¿Dónde está el pico y qué pistas movería para que suba mejor?",
  },
  {
    icon: Puzzle,
    title: "Qué le falta",
    prompt: "¿Qué tipo de tema le falta a mi mixtape para enlazar mejor las partes que no mezclan bien?",
  },
];

// Sin disco ni mixtape: DiscBOT monta sesiones con la colección
const GENERAL_PROMPTS: Suggestion[] = [
  {
    icon: Sparkles,
    title: "Sesión de soul",
    prompt: "Hazme un set de 1 h, de 95 a 110 BPM, solo con mis discos de soul.",
  },
  {
    icon: Disc3,
    title: "Warm-up de 30 minutos",
    prompt: "Propón una sesión de 30 minutos para abrir la noche con mis vinilos, empezando tranquila y subiendo poco a poco.",
  },
  {
    icon: Shuffle,
    title: "Mezclar desde 8A",
    prompt: "Si estoy pinchando un tema en 8A a 120 BPM, ¿a qué tonalidades puedo saltar y qué tengo en mis mixtapes que encaje?",
  },
];

/** Qué está haciendo DiscBOT en cada herramienta (services/agent/musicAgent.ts). */
const TOOL_LABELS: Record<string, [string, string]> = {
  get_discogs_release_info: ["Consultando Discogs", "Datos de Discogs"],
  analyze_harmonic_dj_mix: ["Analizando la rueda Camelot", "Rueda Camelot"],
  get_artist_bio_and_similar: ["Leyendo Last.fm", "Last.fm"],
  get_user_mixtape: ["Leyendo tu mixtape", "Tu mixtape"],
  build_session: ["Montando la sesión con tu colección", "Sesión propuesta"],
  save_session_as_mixtape: ["Guardando la mixtape", "Mixtape guardada"],
};

function ToolPills({ message }: { message: UIMessage }) {
  const tools = message.parts.filter(isToolUIPart);
  if (tools.length === 0) return null;
  return (
    <div className="tw-flex tw-flex-wrap tw-gap-1.5">
      {tools.map((part, i) => {
        const name = getToolName(part);
        const [running, done] = TOOL_LABELS[name] || ["Consultando", "Consulta"];
        const finished = part.state === "output-available" || part.state === "output-error";
        return (
          <span
            key={`${name}-${i}`}
            className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-text-gray-600 tw-bg-gray-100 tw-rounded-full tw-px-2.5 tw-py-1"
          >
            {finished ? (
              <Check className="tw-w-3.5 tw-h-3.5 tw-text-brand-600" />
            ) : (
              <Loader2 className="tw-w-3.5 tw-h-3.5 tw-animate-spin" />
            )}
            {finished ? done : `${running}…`}
          </span>
        );
      })}
    </div>
  );
}

export default function Chat() {
  const router = useRouter();
  const { artista, album, username, disco_id, mixtape_id } = router.query;
  // El enlace desde /mixtape usa artista «Mixtape» y el nombre de la mixtape como álbum
  const isMixtapeChat = artista === "Mixtape";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [chatErrorMessage, setChatErrorMessage] = useState<string | null>(null);

  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (err: Error) => {
      console.error("[useChat] Error recibido:", err);
      setChatErrorMessage(err.message || "Error al procesar la respuesta.");
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Cargar conversaciones previas de este disco
  useEffect(() => {
    if (artista && album && username) {
      getChatHistory(artista as string, album as string).then((data) => {
        const formattedChats: UIMessage[] = [];
        data.forEach((chat) => {
          formattedChats.push({
            id: chat.id.toString() + "-prompt",
            role: "user",
            parts: [{ type: "text", text: chat.prompt }],
          });
          if (chat.response) {
            formattedChats.push({
              id: chat.id.toString() + "-response",
              role: "assistant",
              parts: [{ type: "text", text: chat.response }],
            });
          }
        });
        setMessages(formattedChats);
      });
    }
  }, [artista, album, username, setMessages]);

  const isAlbumChat = Boolean(artista && album && !isMixtapeChat);
  const suggestions = isMixtapeChat ? MIXTAPE_PROMPTS : isAlbumChat ? ALBUM_PROMPTS : GENERAL_PROMPTS;
  const contextTitle = isMixtapeChat ? `Mixtape «${album}»` : isAlbumChat ? `${album}` : "Tu colección";
  const contextSubtitle = isMixtapeChat
    ? "Transiciones, energía y qué le falta a la sesión"
    : isAlbumChat
    ? `${artista} · Discogs, Last.fm y rueda Camelot`
    : "Pídele una sesión con tus vinilos o pregúntale por la rueda Camelot";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setChatErrorMessage(null);
    sendMessage(
      { text },
      { body: { artista, album, disco_id, mixtape_id } }
    );
    setInput("");
  };

  // Auto-scroll al final del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const redirectToAlbum = () => {
    let albumUrl = `/albums/${disco_id}`;
    if (router.query.from === "compare") {
      albumUrl += `?from=compare`;
    }
    router.push(albumUrl);
  };

  const handleSelectSuggestion = (suggestedText: string) => {
    setInput(suggestedText);
    inputRef.current?.focus();
  };

  // El campo crece con el texto (hasta unas 6 líneas)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [input]);

  return (
    <Layout
      title={`DiscBOT · ${contextTitle} | Diskogs+`}
      description="Asistente de inteligencia artificial musical para tus vinilos"
      centeredTopContent={true}
    >
      <div className="tw-flex tw-flex-col tw-h-[calc(100dvh-3.5rem)] lg:tw-h-[100dvh]">
        {/* Cabecera: con qué está hablando DiscBOT */}
        <header className="tw-shrink-0 tw-border-b tw-border-gray-200">
          <div className="tw-max-w-3xl tw-mx-auto tw-px-4 md:tw-px-6 tw-py-4 tw-flex tw-items-center tw-gap-3">
            <VinylDisc size={40} flat />
            <div className="tw-flex-1 tw-min-w-0">
              <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-brand-700">DiscBOT</p>
              <h1 className="tw-text-base tw-font-semibold tw-text-gray-900 tw-truncate">{contextTitle}</h1>
              <p className="tw-text-[13px] tw-text-gray-500 tw-truncate">{contextSubtitle}</p>
            </div>
            {disco_id && (
              <button
                type="button"
                onClick={redirectToAlbum}
                className="tw-flex tw-items-center tw-gap-1.5 tw-h-9 tw-px-3 tw-rounded-full tw-border tw-border-gray-200 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50"
              >
                <ArrowLeft className="tw-w-4 tw-h-4" />
                Volver al disco
              </button>
            )}
            {isMixtapeChat && mixtape_id && (
              <Link
                href={`/mixtape?id=${mixtape_id}`}
                className="tw-flex tw-items-center tw-gap-1.5 tw-h-9 tw-px-3 tw-rounded-full tw-border tw-border-gray-200 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50"
              >
                <ArrowLeft className="tw-w-4 tw-h-4" />
                Volver a la mixtape
              </Link>
            )}
          </div>
        </header>

        {/* Conversación */}
        <div className="tw-flex-1 tw-overflow-y-auto">
          <div className="tw-max-w-3xl tw-mx-auto tw-px-4 md:tw-px-6 tw-py-8 tw-flex tw-flex-col tw-gap-8">
            {messages.length === 0 && (
              <div className="tw-flex tw-flex-col tw-items-center tw-text-center tw-gap-5 tw-pt-6 md:tw-pt-12">
                <VinylDisc size={88} spinning />
                <div>
                  <h2 className="tw-text-2xl tw-font-bold tw-tracking-tight tw-text-gray-900">¿Qué pinchamos hoy?</h2>
                  <p className="tw-text-sm tw-text-gray-500 tw-mt-1 tw-max-w-md">{contextSubtitle}.</p>
                </div>
                <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-2 tw-w-full tw-mt-2">
                  {suggestions.map(({ icon: Icon, title, prompt }) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => handleSelectSuggestion(prompt)}
                      className="tw-flex tw-items-start tw-gap-3 tw-text-left tw-p-3.5 tw-rounded-xl tw-border tw-border-gray-200 hover:tw-border-gray-300 hover:tw-bg-gray-50 tw-transition-colors"
                    >
                      <Icon className="tw-w-[18px] tw-h-[18px] tw-text-brand-600 tw-shrink-0 tw-mt-0.5" />
                      <span>
                        <span className="tw-block tw-text-sm tw-font-semibold tw-text-gray-900">{title}</span>
                        <span className="tw-block tw-text-[13px] tw-text-gray-500 tw-line-clamp-2">{prompt}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => {
              const text = messageText(message);
              if (message.role === "user") {
                if (!text.trim()) return null;
                return (
                  <div key={message.id} className="tw-flex tw-justify-end">
                    <div className="tw-max-w-[85%] tw-rounded-2xl tw-rounded-br-md tw-bg-gray-100 tw-px-4 tw-py-2.5 tw-text-[15px] tw-leading-relaxed tw-text-gray-900 tw-whitespace-pre-line">
                      {text}
                    </div>
                  </div>
                );
              }
              const hasTools = message.parts.some(isToolUIPart);
              if (!text.trim() && !hasTools) return null;
              return (
                <div key={message.id} className="tw-flex tw-gap-3">
                  <VinylDisc size={28} flat className="tw-mt-0.5" />
                  <div className="tw-flex-1 tw-min-w-0 tw-flex tw-flex-col tw-gap-3">
                    <ToolPills message={message} />
                    {text.trim() && <ChatMarkdown text={text} />}
                  </div>
                </div>
              );
            })}

            {status === "submitted" && (
              <div className="tw-flex tw-gap-3 tw-items-center">
                <VinylDisc size={28} flat spinning />
                <span className="tw-text-sm tw-text-gray-500">Pensando…</span>
              </div>
            )}

            {chatErrorMessage && (
              <div role="alert" className="tw-flex tw-items-start tw-justify-between tw-gap-3 tw-text-sm tw-text-red-700 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-xl tw-p-3">
                <span>{chatErrorMessage}</span>
                <button type="button" onClick={() => setChatErrorMessage(null)} className="tw-font-semibold hover:tw-underline">
                  Cerrar
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Campo de texto */}
        <div className="tw-shrink-0 tw-border-t tw-border-gray-200 tw-bg-white">
          <form onSubmit={handleSubmit} className="tw-max-w-3xl tw-mx-auto tw-px-4 md:tw-px-6 tw-py-4">
            <div className="tw-flex tw-items-end tw-gap-2 tw-rounded-2xl tw-border tw-border-gray-300 tw-bg-white tw-p-2 focus-within:tw-border-brand-600 focus-within:tw-ring-2 focus-within:tw-ring-brand-600/15">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  // Intro envía; Mayús+Intro, salto de línea
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder={isAlbumChat ? `Pregunta por ${album}…` : isMixtapeChat ? "Pregunta por tu mixtape…" : "Pide una sesión o pregunta lo que quieras…"}
                aria-label="Mensaje para DiscBOT"
                className="tw-flex-1 tw-resize-none tw-bg-transparent tw-px-2 tw-py-1.5 tw-text-[15px] tw-text-gray-900 tw-outline-none placeholder:tw-text-gray-400"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                aria-label="Enviar"
                className="tw-w-9 tw-h-9 tw-shrink-0 tw-rounded-full tw-bg-brand-600 hover:tw-bg-brand-700 disabled:tw-bg-gray-300 tw-text-white tw-flex tw-items-center tw-justify-center tw-transition-colors"
              >
                {isLoading ? <Loader2 className="tw-w-4 tw-h-4 tw-animate-spin" /> : <ArrowUp className="tw-w-4 tw-h-4" />}
              </button>
            </div>
            <p className="tw-text-[11px] tw-text-gray-400 tw-mt-2 tw-text-center">
              DiscBOT usa Discogs, Last.fm y tus mixtapes. Puede equivocarse: comprueba los datos importantes.
            </p>
          </form>
        </div>
      </div>
    </Layout>
  );
}
