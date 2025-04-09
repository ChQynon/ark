import { Bot, Context, session, SessionFlavor, Keyboard, InlineKeyboard, webhookCallback } from 'grammy';
import { Message } from 'grammy/types';
import * as dotenv from 'dotenv';
import axios from 'axios';
import express from 'express';
import { BotInfo } from 'grammy/out/types';

dotenv.config();

// Message history interface
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Session interface
interface SessionData {
  waitingForCompletion: boolean;
  chatHistory: ChatMessage[];
}

type MyContext = Context & SessionFlavor<SessionData>;

// Bot configuration
const ALLOWED_GROUP_ID = -1002567822254;
const BOT_NAME = "ARK-1";
const BOT_PLATFORM = "PLEXY";
const BOT_CREATOR = "@samgay_nis";
const MAX_HISTORY_LENGTH = 10; // Maximum number of messages to keep in history

// Bot introduction message
const BOT_INTRO = `👋 Привет! Я ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}.
Создан компанией ${BOT_CREATOR}.
Я могу ответить на ваши вопросы и обработать изображения.`;

// Check if environment variables are set
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const YOUR_SITE_URL = process.env.YOUR_SITE_URL || 'https://tgaibot.example.com';
const YOUR_SITE_NAME = process.env.YOUR_SITE_NAME || 'TelegramAIBot';
const IS_VERCEL = process.env.VERCEL === '1';
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';

if (!TELEGRAM_BOT_TOKEN || !OPENROUTER_API_KEY) {
  console.error('Ошибка: TELEGRAM_BOT_TOKEN или OPENROUTER_API_KEY не указаны в файле .env');
  process.exit(1);
}

// Initialize the bot
const bot = new Bot<MyContext>(TELEGRAM_BOT_TOKEN);

// Configure sessions
bot.use(session({
  initial: (): SessionData => ({
    waitingForCompletion: false,
    chatHistory: [],
  }),
}));

// Check if message is from allowed group
function isAllowedGroup(ctx: MyContext): boolean {
  // Разрешаем все чаты, чтобы убедиться, что бот работает
  return true;
  // Раскомментировать строку ниже, если нужно вернуть ограничение по группам
  // return ctx.chat?.type === "private" || ctx.chat?.id === ALLOWED_GROUP_ID;
}

// Add message to chat history
function addToHistory(ctx: MyContext, role: 'user' | 'assistant', content: string): void {
  if (!ctx.session.chatHistory) {
    ctx.session.chatHistory = [];
  }
  
  ctx.session.chatHistory.push({
    role,
    content,
    timestamp: Date.now()
  });
  
  // Keep history within limits
  if (ctx.session.chatHistory.length > MAX_HISTORY_LENGTH) {
    ctx.session.chatHistory = ctx.session.chatHistory.slice(-MAX_HISTORY_LENGTH);
  }
}

// Create main keyboard
function getMainKeyboard(): Keyboard {
  return new Keyboard()
    .text("❓ Задать вопрос")
    .text("📸 Анализ изображения")
    .row()
    .text("ℹ️ О боте")
    .text("📚 Помощь")
    .row()
    .text("🧹 Очистить историю")
    .resized();
}

// Handle start command
bot.command("start", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  await ctx.reply(BOT_INTRO, {
    reply_markup: getMainKeyboard(),
  });
});

// Handle help command
bot.command("help", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  const helpText = `📚 *Как пользоваться ботом ${BOT_NAME}*:

1️⃣ *Прямые сообщения*: просто напишите мне ваш вопрос
2️⃣ *Команда в чате*: используйте команду /ai + ваш вопрос
3️⃣ *Отправка фото*: отправьте фото с описанием или вопросом
4️⃣ *Кнопки*: используйте кнопки внизу для быстрого доступа
5️⃣ *История чата*: я запоминаю вашу историю сообщений и отвечаю с учетом контекста

Создано компанией ${BOT_CREATOR} на базе ${BOT_PLATFORM}.`;

  await ctx.reply(helpText, {
    parse_mode: "Markdown",
    reply_markup: getMainKeyboard(),
  });
});

// Handle about command
bot.command("about", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  await ctx.reply(`ℹ️ *О боте*\n\nЯ ${BOT_NAME}, передовой ИИ-ассистент, разработанный на базе ${BOT_PLATFORM}.\nСоздан компанией ${BOT_CREATOR}.\n\nВерсия: 1.0.0`, {
    parse_mode: "Markdown",
    reply_markup: getMainKeyboard(),
  });
});

// Handle keyboard button presses
bot.hears("❓ Задать вопрос", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  await ctx.reply("Пожалуйста, введите ваш вопрос:", {
    reply_markup: { remove_keyboard: true },
  });
});

bot.hears("📸 Анализ изображения", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  await ctx.reply("Пожалуйста, отправьте изображение для анализа:", {
    reply_markup: { remove_keyboard: true },
  });
});

bot.hears("ℹ️ О боте", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  await ctx.reply(`ℹ️ *О боте*\n\nЯ ${BOT_NAME}, передовой ИИ-ассистент, разработанный на базе ${BOT_PLATFORM}.\nСоздан компанией ${BOT_CREATOR}.\n\nВерсия: 1.0.0`, {
    parse_mode: "Markdown",
    reply_markup: getMainKeyboard(),
  });
});

bot.hears("📚 Помощь", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  const helpText = `📚 *Как пользоваться ботом ${BOT_NAME}*:

1️⃣ *Прямые сообщения*: просто напишите мне ваш вопрос
2️⃣ *Команда в чате*: используйте команду /ai + ваш вопрос
3️⃣ *Отправка фото*: отправьте фото с описанием или вопросом
4️⃣ *Кнопки*: используйте кнопки внизу для быстрого доступа
5️⃣ *История чата*: я запоминаю вашу историю сообщений и отвечаю с учетом контекста

Создано компанией ${BOT_CREATOR} на базе ${BOT_PLATFORM}.`;

  await ctx.reply(helpText, {
    parse_mode: "Markdown",
    reply_markup: getMainKeyboard(),
  });
});

// Clear history button
bot.hears("🧹 Очистить историю", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  ctx.session.chatHistory = [];
  await ctx.reply("История чата очищена. Начинаем общение с чистого листа.", {
    reply_markup: getMainKeyboard(),
  });
});

// Handle direct messages (excluding commands)
bot.on('message:text', async (ctx: MyContext) => {
  console.log('Получено текстовое сообщение:', ctx.message?.text?.substring(0, 50));
  
  // Skip if not allowed group
  if (!isAllowedGroup(ctx)) {
    console.log('Сообщение отклонено - чат не разрешен:', ctx.chat?.id);
    return;
  }
  
  // Skip if it's a command
  if (ctx.message?.text?.startsWith('/')) {
    console.log('Сообщение отклонено - это команда');
    return;
  }
  
  // Add user message to history
  if (ctx.message?.text) {
    console.log('Добавляем сообщение в историю');
    addToHistory(ctx, 'user', ctx.message.text);
  }
  
  // Handle the message
  console.log('Обрабатываем сообщение через handleAIRequest');
  await handleAIRequest(ctx, ctx.message?.text || "");
});

// Handle photo messages
bot.on('message:photo', async (ctx: MyContext) => {
  // Skip if not allowed group
  if (!isAllowedGroup(ctx)) return;
  
  try {
    if (ctx.session.waitingForCompletion) {
      await ctx.reply("Я все еще обрабатываю ваш предыдущий запрос. Пожалуйста, подождите.");
      return;
    }
    
    // Set waiting status
    ctx.session.waitingForCompletion = true;
    
    // Send typing indicator
    if (ctx.chat) {
      await ctx.api.sendChatAction(ctx.chat.id, "typing");
    }
    
    // Get photo details
    const photoInfo = ctx.message?.photo;
    if (!photoInfo) {
      await ctx.reply("Не удалось получить информацию о фото.");
      ctx.session.waitingForCompletion = false;
      return;
    }
    
    const fileId = photoInfo[photoInfo.length - 1].file_id; // Get highest quality image
    
    // Get file path
    const fileInfo = await ctx.api.getFile(fileId);
    const filePath = fileInfo.file_path;
    
    // Form full photo URL
    const photoUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
    
    // Get caption if any, or use default
    const caption = ctx.message?.caption || "Опиши, что на этом изображении";
    
    // Add user message to history
    addToHistory(ctx, 'user', `[Отправлено изображение с вопросом: ${caption}]`);
    
    // Notify user that we're processing
    const statusMsg = await ctx.reply("Обрабатываю изображение...");
    
    // Call OpenRouter API with the image
    const response = await callOpenRouterAPIWithImage(ctx, caption, photoUrl);
    
    // Add bot response to history
    addToHistory(ctx, 'assistant', response);
    
    // Delete the status message
    if (ctx.chat) {
      await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
    }
    
    // Build inline keyboard for more actions
    const inlineKeyboard = new InlineKeyboard()
      .text("Подробнее", "more_details")
      .text("Перевести", "translate");
    
    // Send the AI response
    await ctx.reply(response, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: inlineKeyboard,
    });
  } catch (error) {
    console.error('Ошибка при обработке изображения:', error);
    await ctx.reply('Извините, произошла ошибка при обработке вашего изображения. Пожалуйста, попробуйте еще раз позже.');
  } finally {
    // Reset waiting status
    ctx.session.waitingForCompletion = false;
    
    // Always show main keyboard after processing
    await ctx.reply("Что бы вы хотели сделать дальше?", {
      reply_markup: getMainKeyboard(),
    });
  }
});

// Handle inline keyboard callbacks
bot.callbackQuery("more_details", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery("Получение дополнительной информации...");
  }
  
  await ctx.reply("Запрашиваю дополнительную информацию...");
  
  // Get the message that was replied to (which contains the image)
  const messageWithImage = ctx.callbackQuery?.message?.reply_to_message;
  if (messageWithImage && 'photo' in messageWithImage) {
    // Process with a different prompt for more details
    await handleAIRequest(ctx, "Предоставь более подробный анализ изображения, включая мельчайшие детали и контекст");
  } else {
    await ctx.reply("Не могу найти оригинальное изображение для анализа.");
  }
});

bot.callbackQuery("translate", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery("Перевод контента...");
  }
  
  await ctx.reply("Перевожу содержимое изображения на русский язык...");
  
  const messageWithImage = ctx.callbackQuery?.message?.reply_to_message;
  if (messageWithImage && 'photo' in messageWithImage) {
    // Process with translation prompt
    await handleAIRequest(ctx, "Переведи весь текст на этом изображении на русский язык");
  } else {
    await ctx.reply("Не могу найти оригинальное изображение для перевода.");
  }
});

// Handle /ai command in groups and direct messages
bot.command('ai', async (ctx: MyContext) => {
  // Skip if not allowed group
  if (!isAllowedGroup(ctx)) return;
  
  const queryText = ctx.match;
  
  if (!queryText) {
    await ctx.reply('Пожалуйста, укажите запрос после команды /ai. Например: /ai Какая столица Франции?');
    return;
  }
  
  // Add user message to history
  const query = String(queryText);
  addToHistory(ctx, 'user', query);
  
  await handleAIRequest(ctx, query);
});

// Handler for AI requests
async function handleAIRequest(ctx: MyContext, query: string) {
  console.log('handleAIRequest начал работу, запрос:', query.substring(0, 50));
  
  if (ctx.session.waitingForCompletion) {
    console.log('Ждем завершения предыдущего запроса');
    await ctx.reply("Я все еще обрабатываю ваш предыдущий запрос. Пожалуйста, подождите.");
    return;
  }
  
  if (!query.trim()) {
    console.log('Запрос пустой');
    await ctx.reply("Пожалуйста, введите текст запроса.");
    return;
  }
  
  try {
    // Set waiting status
    ctx.session.waitingForCompletion = true;
    console.log('Статус ожидания установлен');
    
    // Send typing indicator
    if (ctx.chat) {
      console.log('Отправляем индикатор набора текста');
      await ctx.api.sendChatAction(ctx.chat.id, "typing");
    }
    
    // Notify user that we're processing
    console.log('Отправляем сообщение о начале обработки');
    const statusMsg = await ctx.reply("Обрабатываю ваш запрос...");
    
    // Call OpenRouter API
    console.log('Вызываем OpenRouter API');
    const response = await callOpenRouterAPI(ctx, query);
    console.log('Ответ получен от OpenRouter API:', response.substring(0, 50));
    
    // Add bot response to history
    console.log('Добавляем ответ в историю');
    addToHistory(ctx, 'assistant', response);
    
    // Delete the status message
    if (ctx.chat) {
      console.log('Удаляем сообщение о начале обработки');
      await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
    }
    
    // Send the AI response
    console.log('Отправляем ответ пользователю');
    await ctx.reply(response, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: getMainKeyboard(),
    });
  } catch (error) {
    console.error('Ошибка при обработке запроса:', error);
    await ctx.reply('Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз позже.');
  } finally {
    // Reset waiting status
    console.log('Сбрасываем статус ожидания');
    ctx.session.waitingForCompletion = false;
  }
}

// Convert session history to OpenRouter format
function formatHistoryForAPI(ctx: MyContext): Array<{role: string, content: Array<{type: string, text: string}>}> {
  if (!ctx.session.chatHistory || ctx.session.chatHistory.length === 0) {
    return [];
  }
  
  return ctx.session.chatHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: [
      {
        type: 'text',
        text: msg.content
      }
    ]
  }));
}

// Function to call OpenRouter API
async function callOpenRouterAPI(ctx: MyContext, query: string): Promise<string> {
  try {
    // Format conversation history for the API
    const messageHistory = formatHistoryForAPI(ctx);
    
    // Add system message at the beginning of the conversation
    const messages = [
      {
        role: 'system',
        content: [
          {
            type: 'text',
            text: `Ты ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}, созданный компанией ${BOT_CREATOR}. Отвечай на русском языке. Всегда полезен и дружелюбен. Помни предыдущие сообщения в разговоре.`
          }
        ]
      },
      ...messageHistory
    ];
    
    // If the last message was not the user's query, add it
    if (messageHistory.length === 0 || messageHistory[messageHistory.length - 1].role !== 'user') {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: query
          }
        ]
      });
    }
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-4-maverick:free',
        messages: messages,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': YOUR_SITE_URL,
          'X-Title': YOUR_SITE_NAME,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content || 'Нет ответа от ИИ';
  } catch (error) {
    console.error('Ошибка при вызове OpenRouter API:', error);
    throw new Error('Не удалось получить ответ от сервиса ИИ');
  }
}

// Function to call OpenRouter API with image
async function callOpenRouterAPIWithImage(ctx: MyContext, query: string, imageUrl: string): Promise<string> {
  try {
    // Format conversation history for the API
    const messageHistory = formatHistoryForAPI(ctx);
    
    // Add system message at the beginning of the conversation
    const messages = [
      {
        role: 'system',
        content: [
          {
            type: 'text',
            text: `Ты ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}, созданный компанией ${BOT_CREATOR}. Отвечай на русском языке. Всегда полезен и дружелюбен. Помни предыдущие сообщения в разговоре.`
          }
        ]
      },
      ...messageHistory
    ];
    
    // Add current query with image
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Проанализируй это изображение. ${query}`
        },
        {
          type: 'image_url',
          image_url: {
            url: imageUrl
          }
        }
      ]
    });
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-4-maverick:free',
        messages: messages,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': YOUR_SITE_URL,
          'X-Title': YOUR_SITE_NAME,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content || 'Нет ответа от ИИ';
  } catch (error) {
    console.error('Ошибка при вызове OpenRouter API с изображением:', error);
    throw new Error('Не удалось получить ответ от сервиса ИИ для анализа изображения');
  }
}

// Webhook or polling setup based on environment
if (IS_VERCEL && WEBHOOK_URL) {
  // Use webhook mode for Vercel
  const app = express();
  app.use(express.json());
  
  // Обработка вебхуков с более общим маршрутом
  app.use('/api/webhook', (req, res, next) => {
    console.log('Получен запрос вебхука:', req.method, req.url);
    return webhookCallback(bot, 'express')(req, res, next);
  });

  // Добавляем эндпоинт, который просто подтверждает, что бот активен
  app.post('/api/webhook', (req, res) => {
    console.log('Получен POST запрос на /api/webhook');
    res.status(200).json({ ok: true, message: 'Webhook received' });
  });

  // Эндпоинт для ручной активации вебхука через браузер
  app.get('/api/setwebhook', async (req, res) => {
    try {
      const result = await bot.api.setWebhook(WEBHOOK_URL);
      console.log('Результат установки вебхука:', result);
      res.status(200).json({ ok: true, result });
    } catch (error) {
      console.error('Ошибка при установке вебхука:', error);
      res.status(500).json({ ok: false, error: String(error) });
    }
  });
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      bot: BOT_NAME,
      platform: BOT_PLATFORM,
      webhook: WEBHOOK_URL || 'not set'
    });
  });

  // Catch-all маршрут
  app.get('/*', (req, res) => {
    res.status(200).json({ 
      message: `${BOT_NAME} бот работает!`,
      endpoints: [
        "/api/webhook - Telegram webhook endpoint",
        "/api/health - Health check",
        "/api/setwebhook - Manually set webhook URL"
      ]
    });
  });
  
  // Start Express server
  app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`${BOT_NAME} на базе ${BOT_PLATFORM}, создан компанией ${BOT_CREATOR}`);
    console.log(`Режим вебхуков для Vercel активирован`);
    console.log(`WEBHOOK_URL: ${WEBHOOK_URL}`);
    
    // Set webhook
    if (WEBHOOK_URL) {
      bot.api.setWebhook(WEBHOOK_URL)
        .then(() => console.log(`Вебхук установлен на ${WEBHOOK_URL}`))
        .catch(e => console.error('Ошибка при установке вебхука:', e));
    }
  });
} else {
  // Use long polling for local development
  bot.start({
    onStart: (botInfo: BotInfo) => {
      console.log(`Бот @${botInfo.username} запущен!`);
      console.log(`${BOT_NAME} на базе ${BOT_PLATFORM}, создан компанией ${BOT_CREATOR}`);
      console.log(`Разрешенный ID группы: ${ALLOWED_GROUP_ID}`);
    },
  });
}

// Error handling
process.on('uncaughtException', (error: Error) => {
  console.error('Необработанное исключение:', error);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Необработанное отклонение:', promise, 'причина:', reason);
}); 