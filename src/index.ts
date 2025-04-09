import { Bot, Context, session, SessionFlavor, Keyboard, InlineKeyboard } from 'grammy';
import { Message } from 'grammy/types';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Типы сообщений для OpenRouter API
type Role = 'user' | 'assistant' | 'system';

// Контент сообщения
interface TextContent {
  type: 'text';
  text: string;
}

interface ImageContent {
  type: 'image_url';
  image_url: {
    url: string;
  };
}

type MessageContent = TextContent | ImageContent;

// Сообщение для API
interface ApiMessage {
  role: Role;
  content: string | MessageContent[];
}

// Расширенная сессия с историей чатов
interface SessionData {
  waitingForCompletion: boolean;
  chatHistory: ApiMessage[];
}

// Расширенный контекст для бота
type MyContext = Context & SessionFlavor<SessionData>;

// Bot configuration
const ALLOWED_GROUP_ID = -1002567822254;
const BOT_NAME = "ARK-1";
const BOT_PLATFORM = "PLEXY";
const BOT_CREATOR = "@samgay_nis";

// Bot introduction message
const BOT_INTRO = `👋 Привет! Я ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}.
Создан компанией ${BOT_CREATOR}.
Я могу ответить на ваши вопросы и обработать изображения.`;

// Проверка режима запуска (Vercel/локальный)
const IS_VERCEL = process.env.VERCEL === "1";
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Check if environment variables are set
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const YOUR_SITE_URL = process.env.YOUR_SITE_URL || 'https://tgaibot.example.com';
const YOUR_SITE_NAME = process.env.YOUR_SITE_NAME || 'TelegramAIBot';

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
    chatHistory: []
  }),
}));

// Check if message is from allowed group
function isAllowedGroup(ctx: MyContext): boolean {
  return ctx.chat?.type === "private" || ctx.chat?.id === ALLOWED_GROUP_ID;
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
  
  try {
    // Reset history on start
    ctx.session.chatHistory = [];
    
    await ctx.reply(BOT_INTRO, {
      reply_markup: getMainKeyboard(),
    });
  } catch (error) {
    console.error('Ошибка в команде start:', error);
  }
});

// Handle help command
bot.command("help", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  try {
    const helpText = `📚 *Как пользоваться ботом ${BOT_NAME}*:

1️⃣ *Прямые сообщения*: просто напишите мне ваш вопрос
2️⃣ *Команда в чате*: используйте команду /ai + ваш вопрос
3️⃣ *Отправка фото*: отправьте фото с описанием или вопросом
4️⃣ *Кнопки*: используйте кнопки внизу для быстрого доступа
5️⃣ *История чатов*: я запоминаю контекст разговора, но вы можете сбросить его нажав "🧹 Очистить историю"

Создано компанией ${BOT_CREATOR} на базе ${BOT_PLATFORM}.`;

    await ctx.reply(helpText, {
      parse_mode: "Markdown",
      reply_markup: getMainKeyboard(),
    });
  } catch (error) {
    console.error('Ошибка в команде help:', error);
  }
});

// Handle about command
bot.command("about", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  try {
    await ctx.reply(`ℹ️ *О боте*\n\nЯ ${BOT_NAME}, передовой ИИ-ассистент, разработанный на базе ${BOT_PLATFORM}.\nСоздан компанией ${BOT_CREATOR}.\n\nВерсия: 1.0.0`, {
      parse_mode: "Markdown",
      reply_markup: getMainKeyboard(),
    });
  } catch (error) {
    console.error('Ошибка в команде about:', error);
  }
});

// Clear history command and button
bot.command("clear", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  try {
    ctx.session.chatHistory = [];
    await ctx.reply("🧹 История очищена! Начинаем разговор заново.", {
      reply_markup: getMainKeyboard(),
    });
  } catch (error) {
    console.error('Ошибка в команде clear:', error);
  }
});

bot.hears("🧹 Очистить историю", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  try {
    ctx.session.chatHistory = [];
    await ctx.reply("🧹 История очищена! Начинаем разговор заново.", {
      reply_markup: getMainKeyboard(),
    });
  } catch (error) {
    console.error('Ошибка при очистке истории:', error);
  }
});

// Handle keyboard button presses
bot.hears("❓ Задать вопрос", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  try {
    await ctx.reply("Пожалуйста, введите ваш вопрос:", {
      reply_markup: { remove_keyboard: true },
    });
  } catch (error) {
    console.error('Ошибка при обработке кнопки "Задать вопрос":', error);
  }
});

bot.hears("📸 Анализ изображения", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  try {
    await ctx.reply("Пожалуйста, отправьте изображение для анализа:", {
      reply_markup: { remove_keyboard: true },
    });
  } catch (error) {
    console.error('Ошибка при обработке кнопки "Анализ изображения":', error);
  }
});

bot.hears("ℹ️ О боте", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  try {
    await ctx.reply(`ℹ️ *О боте*\n\nЯ ${BOT_NAME}, передовой ИИ-ассистент, разработанный на базе ${BOT_PLATFORM}.\nСоздан компанией ${BOT_CREATOR}.\n\nВерсия: 1.0.0`, {
      parse_mode: "Markdown",
      reply_markup: getMainKeyboard(),
    });
  } catch (error) {
    console.error('Ошибка при обработке кнопки "О боте":', error);
  }
});

bot.hears("📚 Помощь", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  try {
    const helpText = `📚 *Как пользоваться ботом ${BOT_NAME}*:

1️⃣ *Прямые сообщения*: просто напишите мне ваш вопрос
2️⃣ *Команда в чате*: используйте команду /ai + ваш вопрос
3️⃣ *Отправка фото*: отправьте фото с описанием или вопросом
4️⃣ *Кнопки*: используйте кнопки внизу для быстрого доступа
5️⃣ *История чатов*: я запоминаю контекст разговора, но вы можете сбросить его нажав "🧹 Очистить историю"

Создано компанией ${BOT_CREATOR} на базе ${BOT_PLATFORM}.`;

    await ctx.reply(helpText, {
      parse_mode: "Markdown",
      reply_markup: getMainKeyboard(),
    });
  } catch (error) {
    console.error('Ошибка при обработке кнопки "Помощь":', error);
  }
});

// Handle direct messages (excluding commands)
bot.on('message:text', async (ctx: MyContext) => {
  try {
    // Skip if not allowed group
    if (!isAllowedGroup(ctx)) return;
    
    // Skip if it's a command
    if (ctx.message?.text?.startsWith('/')) return;
    
    console.log('Получено текстовое сообщение:', ctx.message?.text);
    
    // Handle the message
    if (ctx.message?.text) {
      await handleAIRequest(ctx, ctx.message.text);
    }
  } catch (error) {
    console.error('Ошибка при обработке текстового сообщения:', error);
    await ctx.reply('Произошла ошибка при обработке сообщения. Пожалуйста, попробуйте еще раз.');
  }
});

// Handle photo messages
bot.on('message:photo', async (ctx: MyContext) => {
  try {
    // Skip if not allowed group
    if (!isAllowedGroup(ctx)) return;
    
    console.log('Получено фото сообщение');
    
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
    if (!ctx.message?.photo) {
      throw new Error("Не найдено изображение в сообщении");
    }
    
    const photoInfo = ctx.message.photo;
    const fileId = photoInfo[photoInfo.length - 1].file_id; // Get highest quality image
    
    // Get file path
    const fileInfo = await ctx.api.getFile(fileId);
    if (!fileInfo.file_path) {
      throw new Error("Не удалось получить путь к файлу изображения");
    }
    
    const filePath = fileInfo.file_path;
    
    // Form full photo URL
    const photoUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
    
    // Get caption if any, or use default
    const caption = ctx.message.caption || "Опиши, что на этом изображении";
    
    // Save user query to history
    ctx.session.chatHistory.push({
      role: 'user',
      content: `[Отправлено изображение] ${caption}`
    });
    
    // Notify user that we're processing
    const statusMsg = await ctx.reply("Обрабатываю изображение...");
    
    // Call OpenRouter API with the image
    const response = await callOpenRouterAPIWithImage(ctx.session.chatHistory, caption, photoUrl);
    
    // Save response to history
    ctx.session.chatHistory.push({
      role: 'assistant',
      content: response
    });
    
    // Delete the status message
    if (ctx.chat && statusMsg) {
      try {
        await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
      } catch (error) {
        console.error('Не удалось удалить статусное сообщение:', error);
      }
    }
    
    // Build inline keyboard for more actions
    const inlineKeyboard = new InlineKeyboard()
      .text("Подробнее", "more_details")
      .text("Перевести", "translate");
    
    // Send the AI response
    await ctx.reply(response, {
      parse_mode: 'Markdown',
      reply_markup: inlineKeyboard,
    });
  } catch (error) {
    console.error('Ошибка при обработке изображения:', error);
    await ctx.reply('Извините, произошла ошибка при обработке вашего изображения. Пожалуйста, попробуйте еще раз позже.');
  } finally {
    // Reset waiting status
    ctx.session.waitingForCompletion = false;
    
    try {
      // Always show main keyboard after processing
      await ctx.reply("Что бы вы хотели сделать дальше?", {
        reply_markup: getMainKeyboard(),
      });
    } catch (error) {
      console.error('Ошибка при отправке финального сообщения:', error);
    }
  }
});

// Handle inline keyboard callbacks
bot.callbackQuery("more_details", async (ctx: MyContext) => {
  try {
    if (!isAllowedGroup(ctx)) return;
    
    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      await ctx.answerCallbackQuery("Получение дополнительной информации...");
      await ctx.reply("Запрашиваю дополнительную информацию...");
      
      // Get the message that was replied to (which contains the image)
      const messageWithImage = ctx.callbackQuery.message?.reply_to_message;
      if (messageWithImage && 'photo' in messageWithImage) {
        // Process with a different prompt for more details
        await handleAIRequest(ctx, "Предоставь более подробный анализ изображения, включая мельчайшие детали и контекст");
      } else {
        await ctx.reply("Не могу найти оригинальное изображение для анализа.");
      }
    }
  } catch (error) {
    console.error('Ошибка при обработке кнопки "Подробнее":', error);
    await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
  }
});

bot.callbackQuery("translate", async (ctx: MyContext) => {
  try {
    if (!isAllowedGroup(ctx)) return;
    
    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      await ctx.answerCallbackQuery("Перевод контента...");
      await ctx.reply("Перевожу содержимое изображения на русский язык...");
      
      const messageWithImage = ctx.callbackQuery.message?.reply_to_message;
      if (messageWithImage && 'photo' in messageWithImage) {
        // Process with translation prompt
        await handleAIRequest(ctx, "Переведи весь текст на этом изображении на русский язык");
      } else {
        await ctx.reply("Не могу найти оригинальное изображение для перевода.");
      }
    }
  } catch (error) {
    console.error('Ошибка при обработке кнопки "Перевести":', error);
    await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
  }
});

// Handle /ai command in groups and direct messages
bot.command('ai', async (ctx: MyContext) => {
  try {
    // Skip if not allowed group
    if (!isAllowedGroup(ctx)) return;
    
    const queryText = ctx.match;
    
    if (!queryText || typeof queryText !== 'string') {
      await ctx.reply('Пожалуйста, укажите запрос после команды /ai. Например: /ai Какая столица Франции?');
      return;
    }
    
    await handleAIRequest(ctx, queryText);
  } catch (error) {
    console.error('Ошибка при обработке команды /ai:', error);
    await ctx.reply('Произошла ошибка при обработке команды. Пожалуйста, попробуйте еще раз.');
  }
});

// Handler for AI requests
async function handleAIRequest(ctx: MyContext, query: string) {
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
    
    // Save user query to history
    ctx.session.chatHistory.push({
      role: 'user',
      content: query
    });
    
    // Notify user that we're processing
    const statusMsg = await ctx.reply("Обрабатываю ваш запрос...");
    
    // Call OpenRouter API
    const response = await callOpenRouterAPI(ctx.session.chatHistory);
    
    // Save response to history
    ctx.session.chatHistory.push({
      role: 'assistant',
      content: response
    });
    
    // Delete the status message
    if (ctx.chat && statusMsg) {
      try {
        await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
      } catch (error) {
        console.error('Не удалось удалить статусное сообщение:', error);
      }
    }
    
    // Send the AI response
    await ctx.reply(response, {
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard(),
    });
  } catch (error) {
    console.error('Ошибка при обработке запроса:', error);
    await ctx.reply('Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз позже.');
  } finally {
    // Reset waiting status
    ctx.session.waitingForCompletion = false;
  }
}

// Function to call OpenRouter API
async function callOpenRouterAPI(chatHistory: SessionData['chatHistory']): Promise<string> {
  try {
    // Prepare the context from chat history
    const messages = prepareMessages(chatHistory);
    
    console.log('Отправка запроса в OpenRouter API', {
      model: 'meta-llama/llama-4-maverick:free',
      messagesCount: messages.length
    });
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-4-maverick:free',
        messages: messages
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': YOUR_SITE_URL,
          'X-Title': YOUR_SITE_NAME,
          'Content-Type': 'application/json',
        },
        timeout: 60000 // 60 секунд таймаут
      }
    );

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      console.error('Некорректный ответ от OpenRouter API:', response.data);
      return 'Нет ответа от ИИ';
    }

    return response.data.choices[0].message.content || 'Нет ответа от ИИ';
  } catch (error) {
    console.error('Ошибка при вызове OpenRouter API:', error);
    throw new Error('Не удалось получить ответ от сервиса ИИ');
  }
}

// Function to call OpenRouter API with image
async function callOpenRouterAPIWithImage(chatHistory: SessionData['chatHistory'], query: string, imageUrl: string): Promise<string> {
  try {
    // Prepare the context from chat history
    const messages = prepareMessages(chatHistory);
    
    // Создаем новое изображение с сообщением
    const imageMessage: ApiMessage = {
      role: 'user',
      content: [
        { type: 'text', text: query },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]
    };
    
    // Удаляем последнее сообщение пользователя (если есть) и добавляем новое с изображением
    const filteredMessages = messages.filter((msg, idx, arr) => 
      !(msg.role === 'user' && idx === arr.length - 1)
    );
    
    filteredMessages.push(imageMessage);
    
    console.log('Отправка запроса с изображением в OpenRouter API', {
      model: 'meta-llama/llama-4-maverick:free',
      messagesCount: filteredMessages.length,
      imageUrl: imageUrl.substring(0, 50) + '...' // Укороченный URL для лога
    });
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-4-maverick:free',
        messages: filteredMessages
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': YOUR_SITE_URL,
          'X-Title': YOUR_SITE_NAME,
          'Content-Type': 'application/json',
        },
        timeout: 90000 // 90 секунд таймаут для изображений
      }
    );

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      console.error('Некорректный ответ от OpenRouter API:', response.data);
      return 'Нет ответа от ИИ';
    }

    return response.data.choices[0].message.content || 'Нет ответа от ИИ';
  } catch (error) {
    console.error('Ошибка при вызове OpenRouter API с изображением:', error);
    throw new Error('Не удалось получить ответ от сервиса ИИ для анализа изображения');
  }
}

// Prepare messages for API
function prepareMessages(chatHistory: SessionData['chatHistory']): ApiMessage[] {
  // Add system message first
  const systemMessage: ApiMessage = {
    role: 'system',
    content: `Ты ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}, созданный компанией ${BOT_CREATOR}. 
Отвечай на русском языке. Всегда полезен и дружелюбен.
У тебя есть следующие возможности:
1. Отвечать на вопросы пользователей
2. Анализировать изображения
3. Переводить текст на изображениях
4. Поддерживать контекст разговора`
  };
  
  // Создаем копию сообщений
  const apiMessages: ApiMessage[] = [systemMessage];
  
  // Берем последние N сообщений, чтобы не превысить лимит токенов
  const recentMessages = chatHistory.slice(-10);
  
  for (const msg of recentMessages) {
    apiMessages.push({
      role: msg.role,
      content: msg.content
    });
  }
  
  return apiMessages;
}

// Обработчик вебхука для Vercel
async function handleWebhook(req: any, res: any) {
  try {
    console.log('Обработка вебхука Telegram', {
      method: req.method,
      hasBody: !!req.body,
      bodyType: typeof req.body,
      updateId: req.body?.update_id
    });
    
    // Проверяем, что запрос содержит обновление
    if (!req.body) {
      throw new Error('Отсутствует тело запроса');
    }
    
    // Обрабатываем обновление
    await bot.handleUpdate(req.body);
    
    // Отвечаем Telegram, что получили запрос
    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка при обработке вебхука:', error);
    res.status(500).send(`Ошибка обработки: ${error.message}`);
  }
}

// Запуск бота в разных режимах
if (IS_VERCEL) {
  // Vercel mode: use webhooks
  if (!WEBHOOK_URL) {
    throw new Error("WEBHOOK_URL не задан в переменных окружения для режима Vercel");
  }
  
  console.log(`Бот работает в режиме вебхуков на ${WEBHOOK_URL}`);
  
  // Экспорт для Vercel API endpoint
  module.exports = async (req: any, res: any) => {
    await handleWebhook(req, res);
  };
} else {
  // Local mode: use long polling
  bot.start({
    onStart: (botInfo) => {
      console.log(`Бот @${botInfo.username} запущен в режиме long polling!`);
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