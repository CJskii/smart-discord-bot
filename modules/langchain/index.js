const { ChatOpenAI } = require("langchain/chat_models/openai");
const {
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
  MessagesPlaceholder,
} = require("langchain/prompts");
const { BufferMemory } = require("langchain/memory");
const { ConversationChain } = require("langchain/chains");

const chat = new ChatOpenAI({ temperature: 0 });

class LangChainManager {
  constructor(client) {
    this.client = client;
    this.initializeListeners();
    this.chat = new ChatOpenAI({ temperature: 0 });
  }

  initializeListeners() {
    this.client.on("messageCreate", (message) => {
      this.handleMessage(message);
    });
  }

  async handleMessage(message) {
    if (!this.shouldProcessMessage(message)) return;
    try {
      const response = await this.callOpenAI(message);
      message.reply(response.response);
    } catch (error) {
      console.error("Failed to process message:", error);
    }
  }

  shouldProcessMessage(message) {
    if (message.author.bot) {
      return false;
    }
    if (!message.mentions.has(this.client.user.id)) {
      return false;
    }
    return true;
  }

  async callOpenAI(message) {
    try {
      const chatPrompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(
          "The Uncle Discord bot(you) is an intelligent chatbot that engages users in conversations, answers questions, and provides information. Default language is Polish"
        ),
        new MessagesPlaceholder("history"),
        HumanMessagePromptTemplate.fromTemplate(message.content),
      ]);

      const chain = new ConversationChain({
        memory: new BufferMemory({
          returnMessages: true,
          memoryKey: "history",
        }),
        prompt: chatPrompt,
        llm: chat,
      });
      const response = await chain.call({
        input: message.content,
      });

      return response;
    } catch (error) {
      console.error("Failed to call OpenAI:", error);
    }
  }
}

module.exports = { LangChainManager };
