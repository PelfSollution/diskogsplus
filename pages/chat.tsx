import Layout from "@/components/Layout";
import { useChat } from "ai/react";
import { useRouter } from "next/router"; // 1. Importa el hook
import { TextField, Typography, Button } from "@mui/material";
import React, { useEffect, useState } from "react";
import { getChatByAlbumAndArtist } from "../services/supabase/getUserChats";

type Message = {
  id: string;
  role: "system" | "user";
  content: string;
};
type UseChatOptions = {
  initialMessages: Message[];
  username?: string;
};

export default function Chat() {
  const router = useRouter();
  const { artista, album, username, disco_id } = router.query;
  const [previousChats, setPreviousChats] = useState<Message[]>([]);

  useEffect(() => {
    if (artista && album && username) {
      getChatByAlbumAndArtist(
        username as string,
        artista as string,
        album as string
      ).then((data) => {
        const formattedChats: Message[] = [];
        data.forEach((chat) => {
          formattedChats.push({
            id: chat.id.toString() + "-prompt",
            role: "user",
            content: chat.prompt,
          });
          if (chat.response) {
            formattedChats.push({
              id: chat.id.toString() + "-response",
              role: "system",
              content: chat.response,
            });
          }
        });
        setPreviousChats(formattedChats);
      });
    }
  }, [artista, album, username]);

  const redirectToAlbum = () => {
    let albumUrl = `/albums/${disco_id}`;
    const fromParam = router.query.from;
    if (fromParam === 'compare') {
      albumUrl += `?from=compare`;
    }
  
    router.push(albumUrl);
  };
  

  const initialPrompt =
    artista && album
      ? `¿Qué más quieres saber del disco ${album} del artista ${artista}?`
      : "Por favor, proporciona el artista y el álbum para obtener más detalles.";

  const initialId = Date.now().toString();

  const { messages, handleSubmit, input, handleInputChange } = useChat({
    initialMessages: [
      ...previousChats,
      { id: initialId, role: "system", content: initialPrompt },
    ],
    body: {
      username: username,
      artista: artista,
      album: album,
      disco_id: disco_id,
    },
  });

  return (
    <Layout
    title="Chat - Diskogs +"
    description="Chatlogs de preguntas a tus Discos"
      centeredTopContent={true}
    >
      <div className="tw-container tw-mx-auto tw-p-6">
        <div className="tw-flex tw-justify-between tw-items-center">
          <h1 className="tw-text-2xl tw-font-bold tw-mb-4">Ask to Disc</h1>
          <button
            className="tw-opacity-100 tw-mb-2 hover:tw-opacity-70 tw-text-blue-400 tw-border tw-border-blue-400 md:tw-px-2 md:tw-py-1 tw-px-1 tw-py-0.5 tw-rounded tw-min-w-[100px]"
            onClick={redirectToAlbum}
          >
            Volver al Disco
          </button>
        </div>
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-w-full md:tw-w-auto tw-px-4 md:tw-px-0 tw-max-h-[calc(100vh-200px)]">
          <div className="tw-overflow-y-auto tw-flex-1 tw-w-full">
            {messages.map((message, i) => (
              <div
                key={i}
                className="tw-font-sm tw-bg-gray-200 tw-p-4 tw-rounded-md tw-mb-2 tw-w-full"
              >
                <Typography variant="body2" color="textSecondary">
                  <span
                    className={`tw-font-bold ${
                      message.role === "user"
                        ? "tw-text-black"
                        : "tw-text-red-400"
                    }`}
                  >
                    {message.role === "user"
                      ? `${username || "Usuario"}: `
                      : "🤖 DiscBOT: "}
                  </span>
                  {message.content}
                </Typography>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="tw-mt-auto tw-w-full">
            <div className="tw-flex tw-flex-col tw-gap-2">
              <TextField
                label="Prompt"
                variant="outlined"
                onChange={handleInputChange}
                value={input}
                className="tw-mr-8"
                id="input"
                size="small"
              />

              <Button type="submit" variant="outlined">
                Enviar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
