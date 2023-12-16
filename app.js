const { Telegraf } = require("telegraf");
const express = require("express");
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai"); // Note: Replace with the correct library if available

const API_TG = process.env["YOUR_TELEGRAM_BOT_TOKEN"];
const bot = new Telegraf(API_TG); // Replace with your actual bot token

const MODEL_NAME = "gemini-pro";
const API_KEY = process.env["API_KEY"];

const genAI = new GoogleGenerativeAI(API_KEY); // Gantilah dengan inisialisasi yang sesuai jika ada
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

const generationConfig = {
  temperature: 0.9,
  topK: 1,
  topP: 1,
  maxOutputTokens: 4048,
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
];

async function sendWithTypingAnimation(ctx, text) {
  await ctx.telegram.sendChatAction(ctx.chat.id, "typing");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await ctx.reply(text);
}

async function startBot() {
  try {
    bot.start((ctx) => ctx.reply("Welcome!"));

    bot.on("text", async (ctx) => {
      const chat = model.startChat({
        generationConfig,
        safetySettings,
        history: [],
      });

      const result = await chat.sendMessage(ctx.message.text);
      const response = result.response;

      await sendWithTypingAnimation(ctx, response.text());
    });

    bot.launch();
  } catch (error) {
    console.error("An error occurred:", error);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await startBot();
  }
}

// Setup Express server for keep-alive endpoint
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Start the bot initially
startBot();