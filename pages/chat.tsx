import Layout from "@/components/Layout";
import { useChat } from 'ai/react';

export default function Chat() {
    const { messages, handleSubmit, input, handleInputChange } = useChat();
    return (
      <Layout
        title="Chat - Discogs Plus"
        description="Chat"
        centeredContent={true}
      >
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full">
            <form onSubmit={handleSubmit}>
            <label htmlFor="input">Prompt</label>

      <input
        name="prompt"
        value={input}
        onChange={handleInputChange}
        id="input"
      />
      <button type="submit">Submit</button>
      {messages.map((message, i) => (
        <div key={i}>{message.content}</div>
      ))}
    </form>
    </div>
      </Layout>
    );
  }
  