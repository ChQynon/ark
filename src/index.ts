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

// Расширенная сессия с историей чатов и кешем
interface SessionData {
  waitingForCompletion: boolean;
  chatHistory: ApiMessage[];
  // Для предотвращения дублирования
  processedMessageIds: Set<number>;
  lastUpdateId?: number;
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

// Глобальный кеш для предотвращения дублирования запросов
const processedUpdates = new Set<number>();

// Дополнительные настройки для ускорения
const API_TIMEOUT_TEXT = 20000; // 20 секунд для текстовых запросов
const API_TIMEOUT_IMAGE = 30000; // 30 секунд для изображений
const MAX_HISTORY_MESSAGES = 3; // Максимальное количество сообщений в истории

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
    processedMessageIds: new Set()
  }),
}));

// Middleware для предотвращения дублирования сообщений
bot.use(async (ctx, next) => {
  // Быстрая проверка дубликатов
  if (ctx.update.update_id) {
    if (processedUpdates.has(ctx.update.update_id)) {
      console.log(`Пропуск дубликата обновления ID: ${ctx.update.update_id}`);
      return;
    }
    
    processedUpdates.add(ctx.update.update_id);
    
    // Ограничиваем размер кеша
    if (processedUpdates.size > 1000) {
      const iter = processedUpdates.values();
      processedUpdates.delete(iter.next().value);
    }
  }
  
  // Проверка дубликатов сообщений
  if (ctx.message?.message_id) {
    if (ctx.session.processedMessageIds.has(ctx.message.message_id)) {
      console.log(`Пропуск дубликата сообщения ID: ${ctx.message.message_id}`);
      return;
    }
    
    ctx.session.processedMessageIds.add(ctx.message.message_id);
    
    // Ограничиваем размер кеша
    if (ctx.session.processedMessageIds.size > 100) {
      const iter = ctx.session.processedMessageIds.values();
      ctx.session.processedMessageIds.delete(iter.next().value);
    }
  }
  
  // Продолжаем обработку
  await next();
});

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

// Handle text messages
bot.on('message:text', async (ctx: MyContext) => {
  try {
    // Skip if not allowed group or is a command
    if (!isAllowedGroup(ctx) || (ctx.message?.text?.startsWith('/') && ctx.message.text !== '/start')) return;
    
    // Логируем получение сообщения
    console.log(`Получено сообщение: ${ctx.message?.text?.substring(0, 30)}...`);
    
    // Моментально отвечаем пользователю чтобы он видел, что бот получил сообщение
    const statusMsg = await ctx.reply("⏳ Обрабатываю...");
    
    // Обрабатываем запрос асинхронно
    if (ctx.message?.text && !ctx.message.text.startsWith('/')) {
      // Запускаем асинхронную обработку без ожидания
      processAIRequest(ctx, ctx.message.text, statusMsg.message_id).catch(error => {
        console.error('Ошибка при обработке текстового сообщения:', error);
      });
    }
  } catch (error) {
    console.error('Ошибка при получении текстового сообщения:', error);
  }
});

// Handle photo messages
bot.on('message:photo', async (ctx: MyContext) => {
  try {
    // Skip if not allowed group
    if (!isAllowedGroup(ctx)) return;
    
    // Моментально отвечаем пользователю чтобы он видел, что бот получил фото
    const statusMsg = await ctx.reply("📸 Получил изображение, обрабатываю...");
    
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
    
    // Обрабатываем запрос асинхронно без ожидания
    processImageRequest(ctx, caption, photoUrl, statusMsg.message_id).catch(error => {
      console.error('Ошибка при обработке изображения:', error);
    });
    
  } catch (error) {
    console.error('Ошибка при получении изображения:', error);
  }
});

// Асинхронная обработка запроса с изображением
async function processImageRequest(ctx: MyContext, caption: string, photoUrl: string, statusMsgId: number) {
  try {
    // Пометка, что обработка началась
    ctx.session.waitingForCompletion = true;
    
    // Индикатор набора текста
    if (ctx.chat) {
      await ctx.api.sendChatAction(ctx.chat.id, "typing");
    }
    
    // Save user query to history
    ctx.session.chatHistory.push({
      role: 'user',
      content: `[Отправлено изображение] ${caption}`
    });
    
    // Call OpenRouter API with the image
    const response = await callOpenRouterAPIWithImage(ctx.session.chatHistory, caption, photoUrl);
    
    // Save response to history
    ctx.session.chatHistory.push({
      role: 'assistant',
      content: response
    });
    
    // Delete the status message
    if (ctx.chat) {
      try {
        await ctx.api.deleteMessage(ctx.chat.id, statusMsgId);
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
    
    // Show main keyboard after processing
    await ctx.reply("Что бы вы хотели сделать дальше?", {
      reply_markup: getMainKeyboard(),
    });
  } catch (error) {
    console.error('Ошибка при асинхронной обработке изображения:', error);
    await ctx.reply('Извините, произошла ошибка при обработке вашего изображения. Пожалуйста, попробуйте еще раз позже.', {
      reply_markup: getMainKeyboard(),
    });
  } finally {
    // Reset waiting status
    ctx.session.waitingForCompletion = false;
  }
}

// Handle inline keyboard callbacks
bot.callbackQuery(["more_details", "translate"], async (ctx: MyContext) => {
  try {
    if (!isAllowedGroup(ctx)) return;
    
    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      // Моментально подтверждаем получение колбека
      await ctx.answerCallbackQuery();
      
      const statusMsg = await ctx.reply("⏳ Обрабатываю запрос...");
      
      // Выбираем промпт в зависимости от типа колбека
      let prompt = "Предоставь дополнительную информацию";
      if (ctx.callbackQuery.data === "more_details") {
        prompt = "Предоставь более подробный анализ изображения, включая мельчайшие детали и контекст";
      } else if (ctx.callbackQuery.data === "translate") {
        prompt = "Переведи весь текст на этом изображении на русский язык";
      }
      
      // Асинхронно обрабатываем запрос
      processAIRequest(ctx, prompt, statusMsg.message_id).catch(error => {
        console.error('Ошибка при обработке колбека:', error);
      });
    }
  } catch (error) {
    console.error('Ошибка при обработке колбека:', error);
  }
});

// Handle /ai command
bot.command('ai', async (ctx: MyContext) => {
  try {
    // Skip if not allowed group
    if (!isAllowedGroup(ctx)) return;
    
    const queryText = ctx.match;
    
    if (!queryText || typeof queryText !== 'string') {
      await ctx.reply('Пожалуйста, укажите запрос после команды /ai. Например: /ai Какая столица Франции?');
      return;
    }
    
    // Моментально отвечаем что получили запрос
    const statusMsg = await ctx.reply("⏳ Обрабатываю запрос...");
    
    // Асинхронно обрабатываем запрос
    processAIRequest(ctx, queryText, statusMsg.message_id).catch(error => {
      console.error('Ошибка при обработке команды /ai:', error);
    });
    
  } catch (error) {
    console.error('Ошибка при обработке команды /ai:', error);
  }
});

// Асинхронная обработка текстового запроса
async function processAIRequest(ctx: MyContext, query: string, statusMsgId: number) {
  try {
    // Пометка, что обработка началась
    ctx.session.waitingForCompletion = true;
    
    // Индикатор набора текста
    if (ctx.chat) {
      await ctx.api.sendChatAction(ctx.chat.id, "typing");
    }
    
    // Save user query to history
    ctx.session.chatHistory.push({
      role: 'user',
      content: query
    });
    
    // Call OpenRouter API
    const response = await callOpenRouterAPI(ctx.session.chatHistory);
    
    // Save response to history
    ctx.session.chatHistory.push({
      role: 'assistant',
      content: response
    });
    
    // Delete the status message
    if (ctx.chat) {
      try {
        await ctx.api.deleteMessage(ctx.chat.id, statusMsgId);
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
    await ctx.reply('Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз позже.', {
      reply_markup: getMainKeyboard(),
    });
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
        timeout: API_TIMEOUT_TEXT // 20 секунд таймаут
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
        timeout: API_TIMEOUT_IMAGE // 30 секунд таймаут
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
Отвечай на русском языке. Всегда полезен и дружелюбен. Отвечай кратко и по делу.
У тебя есть следующие возможности:
1. Отвечать на вопросы пользователей
2. Анализировать изображения
3. Переводить текст на изображениях
4. Поддерживать контекст разговора`
  };
  
  // Создаем копию сообщений
  const apiMessages: ApiMessage[] = [systemMessage];
  
  // Берем последние N сообщений, чтобы не превысить лимит токенов
  const recentMessages = chatHistory.slice(-MAX_HISTORY_MESSAGES); // Сокращено до 3 сообщений для скорости
  
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
    // Мгновенно отвечаем, что получили запрос
    res.status(200).send('OK');
    
    // Проверяем дублирование запроса
    if (req.body?.update_id && processedUpdates.has(req.body.update_id)) {
      console.log(`Вебхук: пропуск дубликата обновления ID: ${req.body.update_id}`);
      return;
    }
    
    // Запоминаем ID обновления
    if (req.body?.update_id) {
      processedUpdates.add(req.body.update_id);
    }
    
    // Проверяем, что запрос содержит обновление
    if (!req.body) {
      console.error('Отсутствует тело запроса');
      return;
    }
    
    // Обрабатываем обновление асинхронно без ожидания
    bot.handleUpdate(req.body).catch(error => {
      console.error('Ошибка при асинхронной обработке вебхука:', error);
    });
    
  } catch (error) {
    console.error('Ошибка при обработке вебхука:', error);
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

// Регулярно очищаем кеш обработанных сообщений
setInterval(() => {
  if (processedUpdates.size > 500) {
    console.log(`Очистка кеша обновлений: ${processedUpdates.size} -> 100`);
    const toKeep = Array.from(processedUpdates).slice(-100);
    processedUpdates.clear();
    toKeep.forEach(id => processedUpdates.add(id));
  }
}, 60000); // Очищаем каждую минуту

// Error handling
process.on('uncaughtException', (error: Error) => {
  console.error('Необработанное исключение:', error);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Необработанное отклонение:', promise, 'причина:', reason);
}); 