import Layout from "@/components/Layout";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useRouter } from "next/router";
import React, { useEffect, useState, useRef } from "react";
import { getChatHistory } from "@/services/client/userData";
import Link from "next/link";

function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

const SUGGESTED_PROMPTS = [
  {
    icon: "💰",
    title: "Valor y rareza",
    prompt: "¿Cuál es el valor actual en el mercado de Discogs de esta edición y cuántas copias hay en venta?",
  },
  {
    icon: "🎧",
    title: "Mezcla DJ Armónica",
    prompt: "¿Cómo puedo mezclar canciones de este disco con la rueda Camelot? ¿Qué transiciones de energía me sugieres?",
  },
  {
    icon: "📖",
    title: "Historia y Similares",
    prompt: "Cuéntame el contexto histórico y anécdotas de este álbum, y qué otros artistas similares debería escuchar.",
  },
  {
    icon: "📀",
    title: "Buscar en mi Mixtape",
    prompt: "¿Tengo algún tema en mi Mixtape personal que mezcle armónicamente con este disco?",
  },
];

export default function Chat() {
  const router = useRouter();
  const { artista, album, username, disco_id } = router.query;
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
  const lastMessage = messages[messages.length - 1];
  // Mientras el agente llama a herramientas todavía no hay texto que mostrar
  const isWaitingForText =
    status === "submitted" ||
    (status === "streaming" &&
      (lastMessage?.role !== "assistant" || !messageText(lastMessage).trim()));

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

  const welcomeMessage =
    artista && album
      ? `¡Hola! Soy tu DiscBOT Agent musical. Estoy conectado a Discogs, Last.fm y al analizador armónico Camelot para el disco "${album}" de ${artista}. ¿En qué te puedo asesorar?`
      : "Por favor, selecciona un álbum desde tu catálogo para conversar con el agente especializado.";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setChatErrorMessage(null);
    sendMessage(
      { text },
      { body: { artista, album, disco_id } }
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
  };

  return (
    <Layout
      title={`DiscBOT Agent - ${album || "Chat"}`}
      description="Asistente de inteligencia artificial musical para tus vinilos"
      centeredTopContent={true}
    >
      <div className="tw-container tw-mx-auto tw-max-w-4xl tw-p-4 md:tw-p-6 tw-flex tw-flex-col tw-h-[calc(100vh-100px)]">
        {/* Cabecera del Agente */}
        <div className="tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-p-4 tw-shadow-sm tw-border tw-border-gray-100 dark:tw-border-gray-700 tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4">
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-w-12 tw-h-12 tw-rounded-xl tw-bg-gradient-to-tr tw-from-brand-600 tw-to-brand-500 tw-flex tw-items-center tw-justify-center tw-text-white tw-text-2xl tw-shadow-md">
              🤖
            </div>
            <div>
              <div className="tw-flex tw-items-center tw-gap-2">
                <h1 className="tw-text-xl tw-font-bold tw-text-gray-900 dark:tw-text-white">
                  DiscBOT Agent
                </h1>
                <span className="tw-bg-brand-100 tw-text-brand-800 dark:tw-bg-brand-900/40 dark:tw-text-brand-300 tw-text-xs tw-px-2 tw-py-0.5 tw-rounded-full tw-font-medium">
                  Tool Calling v2
                </span>
              </div>
              <p className="tw-text-sm tw-text-gray-500 dark:tw-text-gray-400">
                {album && artista ? (
                  <>
                    Analizando: <strong className="tw-text-gray-800 dark:tw-text-gray-200">{album}</strong> de {artista}
                  </>
                ) : (
                  "Explorador de colecciones y vinilos"
                )}
              </p>
            </div>
          </div>

          <div className="tw-flex tw-items-center tw-gap-2">
            {disco_id && (
              <button
                onClick={redirectToAlbum}
                className="tw-text-sm tw-font-medium tw-text-brand-600 hover:tw-text-brand-700 dark:tw-text-brand-400 tw-border tw-border-brand-200 dark:tw-border-brand-800 tw-bg-brand-50/50 dark:tw-bg-brand-950/40 tw-px-3 tw-py-1.5 tw-rounded-lg tw-transition-colors"
              >
                ← Volver al Disco
              </button>
            )}
          </div>
        </div>

        {/* Herramientas conectadas (Badges) */}
        <div className="tw-flex tw-flex-wrap tw-gap-2 tw-mb-3 tw-px-1">
          <span className="tw-text-xs tw-bg-gray-100 dark:tw-bg-gray-800 tw-text-gray-600 dark:tw-text-gray-300 tw-px-2.5 tw-py-1 tw-rounded-md tw-flex tw-items-center tw-gap-1">
            <span>📦</span> Discogs DB & Precios
          </span>
          <span className="tw-text-xs tw-bg-gray-100 dark:tw-bg-gray-800 tw-text-gray-600 dark:tw-text-gray-300 tw-px-2.5 tw-py-1 tw-rounded-md tw-flex tw-items-center tw-gap-1">
            <span>🎧</span> Rueda Camelot DJ
          </span>
          <span className="tw-text-xs tw-bg-gray-100 dark:tw-bg-gray-800 tw-text-gray-600 dark:tw-text-gray-300 tw-px-2.5 tw-py-1 tw-rounded-md tw-flex tw-items-center tw-gap-1">
            <span>🎵</span> Last.fm Bio & Similares
          </span>
          <span className="tw-text-xs tw-bg-gray-100 dark:tw-bg-gray-800 tw-text-gray-600 dark:tw-text-gray-300 tw-px-2.5 tw-py-1 tw-rounded-md tw-flex tw-items-center tw-gap-1">
            <span>📀</span> Mixtape personal
          </span>
        </div>

        {/* Contenedor de Mensajes */}
        <div className="tw-flex-1 tw-overflow-y-auto tw-bg-white/60 dark:tw-bg-gray-900/60 tw-backdrop-blur-sm tw-rounded-2xl tw-p-4 md:tw-p-6 tw-border tw-border-gray-200 dark:tw-border-gray-800 tw-space-y-4">
          <div className="tw-flex tw-gap-3 tw-justify-start">
            <div className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-brand-600 tw-text-white tw-flex tw-items-center tw-justify-center tw-text-sm tw-shrink-0 tw-shadow">
              🤖
            </div>
            <div className="tw-max-w-[85%] md:tw-max-w-[75%] tw-rounded-2xl tw-p-4 tw-shadow-sm tw-bg-white dark:tw-bg-gray-800 tw-text-gray-800 dark:tw-text-gray-100 tw-border tw-border-gray-100 dark:tw-border-gray-700 tw-rounded-tl-none">
              <div className="tw-text-xs tw-font-semibold tw-mb-1 tw-opacity-80">DiscBOT Agent</div>
              <div className="tw-text-sm tw-whitespace-pre-line tw-leading-relaxed">{welcomeMessage}</div>
            </div>
          </div>

          {messages.map((message) => {
            const text = messageText(message);
            if (!text.trim()) return null;
            const isUser = message.role === "user";
            return (
              <div
                key={message.id}
                className={`tw-flex tw-gap-3 ${isUser ? "tw-justify-end" : "tw-justify-start"}`}
              >
                {!isUser && (
                  <div className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-brand-600 tw-text-white tw-flex tw-items-center tw-justify-center tw-text-sm tw-shrink-0 tw-shadow">
                    🤖
                  </div>
                )}
                <div
                  className={`tw-max-w-[85%] md:tw-max-w-[75%] tw-rounded-2xl tw-p-4 tw-shadow-sm ${
                    isUser
                      ? "tw-bg-brand-600 tw-text-white tw-rounded-tr-none"
                      : "tw-bg-white dark:tw-bg-gray-800 tw-text-gray-800 dark:tw-text-gray-100 tw-border tw-border-gray-100 dark:tw-border-gray-700 tw-rounded-tl-none"
                  }`}
                >
                  <div className="tw-text-xs tw-font-semibold tw-mb-1 tw-opacity-80">
                    {isUser ? (username ? `${username}` : "Tú") : "DiscBOT Agent"}
                  </div>
                  <div className="tw-text-sm tw-whitespace-pre-line tw-leading-relaxed">
                    {text}
                  </div>
                </div>
                {isUser && (
                  <div className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-brand-500 tw-text-white tw-flex tw-items-center tw-justify-center tw-text-sm tw-shrink-0 tw-shadow">
                    👤
                  </div>
                )}
              </div>
            );
          })}

          {isWaitingForText && (
            <div className="tw-flex tw-gap-3 tw-justify-start tw-items-center">
              <div className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-brand-600 tw-text-white tw-flex tw-items-center tw-justify-center tw-text-sm tw-shrink-0 tw-animate-pulse">
                🤖
              </div>
              <div className="tw-bg-white dark:tw-bg-gray-800 tw-text-gray-500 dark:tw-text-gray-400 tw-text-sm tw-px-4 tw-py-2 tw-rounded-2xl tw-border tw-border-gray-100 dark:tw-border-gray-700 tw-flex tw-items-center tw-gap-2">
                <span className="tw-inline-block tw-w-2 tw-h-2 tw-rounded-full tw-bg-brand-500 tw-animate-ping" />
                DiscBOT está consultando herramientas y analizando la música...
              </div>
            </div>
          )}

          {chatErrorMessage && (
            <div className="tw-bg-red-50 dark:tw-bg-red-950/30 tw-border tw-border-red-200 dark:tw-border-red-800 tw-text-red-700 dark:tw-text-red-300 tw-text-xs tw-p-3 tw-rounded-xl tw-flex tw-items-center tw-justify-between">
              <span>⚠️ {chatErrorMessage}</span>
              <button
                type="button"
                onClick={() => setChatErrorMessage(null)}
                className="tw-text-red-500 hover:tw-underline tw-font-semibold tw-ml-2"
              >
                Cerrar
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sugerencias Rápidas */}
        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-2 tw-mt-3 tw-mb-3">
          {SUGGESTED_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSuggestion(item.prompt)}
              className="tw-text-left tw-p-2 tw-rounded-xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-bg-white/80 dark:tw-bg-gray-800/80 hover:tw-border-brand-400 dark:hover:tw-border-brand-500 tw-transition-all tw-group"
            >
              <div className="tw-text-base tw-mb-0.5">{item.icon}</div>
              <div className="tw-text-xs tw-font-semibold tw-text-gray-700 dark:tw-text-gray-200 group-hover:tw-text-brand-600 dark:group-hover:tw-text-brand-400">
                {item.title}
              </div>
            </button>
          ))}
        </div>

        {/* Formulario de Entrada */}
        <form onSubmit={handleSubmit} className="tw-relative">
          <div className="tw-flex tw-items-center tw-gap-2 tw-bg-white dark:tw-bg-gray-800 tw-p-2 tw-rounded-2xl tw-shadow-md tw-border tw-border-gray-200 dark:tw-border-gray-700">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Pregunta a DiscBOT sobre ${album || "este disco"}...`}
              disabled={isLoading}
              className="tw-flex-1 tw-bg-transparent tw-px-4 tw-py-2 tw-text-sm tw-text-gray-900 dark:tw-text-white tw-outline-none placeholder:tw-text-gray-400"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="tw-bg-brand-600 hover:tw-bg-brand-700 disabled:tw-opacity-50 tw-text-white tw-font-medium tw-text-sm tw-px-5 tw-py-2.5 tw-rounded-xl tw-transition-colors tw-flex tw-items-center tw-gap-1.5 tw-shadow-sm"
            >
              <span>Enviar</span>
              <span>→</span>
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
