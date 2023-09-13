import Layout from "@/components/Layout";
import { useChat } from "ai/react";
import { useRouter } from 'next/router'; // 1. Importa el hook
import { TextField, Typography, Button } from "@mui/material";

type Message = {
  id: string;
  role: "function" | "system" | "assistant" | "user";
  content: string;
};


export default function Chat() {
  const router = useRouter();
  const { artista, album, username } = router.query;

  
  const initialPrompt = artista && album 
    ? `¿Qué más quieres saber del disco ${album} del artista ${artista}?`
    : "Por favor, proporciona el artista y el álbum para obtener más detalles.";
  
  const initialId = Date.now().toString();
  
  const { messages, handleSubmit, input, handleInputChange } = useChat({
    initialMessages: [{ id: initialId, role: 'assistant', content: initialPrompt }]
  });
  


  return (
<Layout
    title="Chat - Discogs Plus"
    description="Chat"
    centeredTopContent={true}
>
<div className="tw-container tw-mx-auto tw-p-6">
        <h1 className="tw-text-2xl tw-font-bold tw-mb-4">Ask to Disc</h1>
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-w-full md:tw-w-auto tw-px-4 md:tw-px-0 tw-max-h-[calc(100vh-200px)]">
        
        <div className="tw-overflow-y-auto tw-flex-1 tw-w-full">
            {messages.map((message, i) => (
                <div
                    key={i}
                    className="tw-font-sm tw-bg-gray-200 tw-p-4 tw-rounded-md tw-mb-2 tw-w-full"
                >
                    <Typography variant="body2" color="textSecondary">
                        <span className={`tw-font-bold ${message.role === 'user' ? 'tw-text-black' : 'tw-text-red-400'}`}>
                        {message.role === 'user' ? `${username || 'Usuario'}: ` : '🤖 DiscBOT: '}

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
