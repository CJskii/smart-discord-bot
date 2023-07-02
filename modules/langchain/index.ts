import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "langchain/prompts";
import { BufferMemory, ConversationSummaryMemory } from "langchain/memory";
import { LLMChain } from "langchain/chains";

interface Client {
  on(event: string, listener: (message: Message) => void): void;
  user: {
    id: string;
  };
}

interface Message {
  author: {
    bot: boolean;
  };
  mentions: {
    has(id: string): boolean;
  };
  content: string;
  reply(content: string): void;
}

interface ChatOptions {
  temperature: number;
}

interface ChainOptions {
  memory: BufferMemory;
  prompt: typeof ChatPromptTemplate;
  llm: ChatOpenAI;
}

export default class LangChainManager {
  private client: Client;
  private chat: ChatOpenAI;
  private memory: BufferMemory;

  constructor(client: Client) {
    this.client = client;
    this.initializeListeners();
    this.chat = new ChatOpenAI({ temperature: 0 } as ChatOptions);
    this.memory = new ConversationSummaryMemory({
      memoryKey: "chat_history",
      llm: new ChatOpenAI({ modelName: "gpt-3.5-turbo", temperature: 0 }),
    });
  }

  initializeListeners(): void {
    this.client.on("messageCreate", (message: Message) => {
      this.handleMessage(message);
    });
  }

  async handleMessage(message: Message): Promise<void> {
    if (!this.shouldProcessMessage(message)) return;
    try {
      const response = await this.callOpenAI(message);
      message.reply(response ? response.response : "Error processing message");
    } catch (error) {
      console.error("Failed to process message:", error);
    }
  }

  shouldProcessMessage(message: Message): boolean {
    if (message.author.bot) {
      return false;
    }
    if (!message.mentions.has(this.client.user.id)) {
      return false;
    }
    return true;
  }

  async callOpenAI(message: Message) {
    try {
      const chatPrompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(
          "The Uncle bot(you) is an intelligent chatbot that engages users in conversations, answers questions, and provides information."
        ),
        new MessagesPlaceholder("history"),
        HumanMessagePromptTemplate.fromTemplate(message.content),
      ]);

      // create the chain with the ConversationSummaryMemory instance
      const chain = new LLMChain({
        llm: this.chat,
        prompt: chatPrompt,
        memory: this.memory,
      });
      const response = await chain.call({
        input: message.content,
      });
      console.log({
        response,
        memory: await this.memory.loadMemoryVariables({}),
      });

      return response;
    } catch (error) {
      console.error("Failed to call OpenAI:", error);
    }
  }
}
