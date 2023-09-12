import Layout from "@/components/Layout";
import { useChat } from "ai/react";
import { TextField, Typography, Button } from "@mui/material";

export default function Chat() {
  const { messages, handleSubmit, input, handleInputChange } = useChat();
  return (
    <Layout
      title="Chat - Discogs Plus"
      description="Chat"
      centeredContent={true}
    >
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full">
      {messages.map((message, i) => (
            <div
              key={i}
              className="tw-font-sm tw-bg-gray-200 tw-p-4 tw-rounded-md tw-mb-2 tw-max-w-[800px] tw-min-w-[800px]"
            >
              <Typography variant="body2" color="textSecondary">
                {message.content}
              </Typography>
            </div>
          ))}
        <form onSubmit={handleSubmit} className="tw-mt-4">
   
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
    </Layout>
  );
}
