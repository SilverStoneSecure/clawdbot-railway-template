import { Client, GatewayIntentBits } from 'discord.js';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const QUIZ_QUESTIONS = [
  { q: "What is 2 + 2?", a: "4", subject: "math" },
  { q: "What is the capital of France?", a: "Paris", subject: "history" },
  { q: "What is H2O?", a: "water", subject: "science" },
  { q: "What is 10 × 5?", a: "50", subject: "math" },
  { q: "What year did WW2 end?", a: "1945", subject: "history" },
];

const userQuizProgress = new Map();

export async function startDiscordBot() {
  if (!DISCORD_TOKEN) {
    console.warn('[discord-bot] DISCORD_TOKEN not set, skipping bot start');
    return null;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once('ready', () => {
    console.log(`[discord-bot] Logged in as ${client.user.tag}`);
  });

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    try {
      const content = message.content.trim();

      if (message.mentions.has(client.user) || message.channel.isDMBased()) {
        const text = content.replace(`<@${client.user.id}>`, '').trim();
        if (text) {
          await message.reply(`Hey! You said: "${text}". I'm SilverStone, your gaming & study buddy! 🎮📚`);
        }
      }

      if (content === '!gaming-news') {
        await message.reply('🎮 **Latest Gaming News**\n\nCheck back soon for real gaming news! For now, here are some hot topics:\n- New game releases this week\n- Esports tournament updates\n- Gaming hardware reviews');
      }

      if (content === '!quiz') {
        const userId = message.author.id;
        if (!userQuizProgress.has(userId)) {
          userQuizProgress.set(userId, { score: 0, total: 0 });
        }

        const question = QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];
        const progress = userQuizProgress.get(userId);

        await message.reply(`📚 **Quiz Time!**\n\n**Q:** ${question.q}\n\nReply with your answer! (Subject: ${question.subject})`);

        const filter = (m) => m.author.id === userId;
        try {
          const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30_000 });
          const answer = collected.first();

          if (answer.content.toLowerCase().includes(question.a.toLowerCase())) {
            progress.score++;
            await answer.reply(`✅ Correct! Your score: ${progress.score}/${++progress.total}`);
          } else {
            await answer.reply(`❌ Wrong! The answer was: **${question.a}**\nYour score: ${progress.score}/${++progress.total}`);
          }
        } catch {
          await message.reply('⏱️ Time\'s up! No answer received.');
        }
      }

      if (content === '!help') {
        await message.reply(`🤖 **SilverStone Commands**\n\n\`@SilverStone <message>\` - Chat with me\n\`!gaming-news\` - Get gaming news\n\`!quiz\` - Take a quiz\n\`!help\` - Show this message`);
      }
    } catch (err) {
      console.error('[discord-bot] Error handling message:', err);
    }
  });

  client.on('error', (err) => {
    console.error('[discord-bot] Client error:', err);
  });

  await client.login(DISCORD_TOKEN);
  return client;
}
   
