// openaiConfig.ts
import { OpenAI, ClientOptions } from "openai";


const clientOptions: ClientOptions = {
    apiKey: process.env.OPENAI_API_KEY,
    //organization: process.env.OPENAI_ORGANIZATION,
};

const openaiClient = new OpenAI(clientOptions);

export default openaiClient;
