require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require(`discord.js`);
const { LangChainManager } = require(`./modules/langchain/index.js`);
// ___ Discord Client ___

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildScheduledEvents,
  ],
});

(async () => {
  console.log("Starting the bot...\n");

  loadConfigAndInitializeBot();
})();

async function loadConfigAndInitializeBot() {
  try {
    const environment = process.env.BOT_ENVIRONMENT;
    console.log(`Environment: ${environment}`);
    const DISCORD_BOT_TOKEN =
      environment === "prod"
        ? process.env.PROD_DISCORD_BOT_TOKEN
        : process.env.DEV_DISCORD_BOT_TOKEN;

    if (!DISCORD_BOT_TOKEN) {
      console.error("Error: Discord bot token not found.");
      return;
    }

    initializeBot(DISCORD_BOT_TOKEN);
  } catch (error) {
    console.error("Error loading configuration data:", error.message);
  }
}

async function initializeBot(DISCORD_BOT_TOKEN) {
  client.once("ready", async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    console.log("Initializing LangChain...");
    const langChainManager = new LangChainManager(client);

    console.log(`\nI am listening for events now...`);
  });
  client.login(DISCORD_BOT_TOKEN);
}
