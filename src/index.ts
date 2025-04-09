import { Bot, Context, session, SessionFlavor, Keyboard, InlineKeyboard } from 'grammy';
import { Message } from 'grammy/types';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Простая сессия только с историей чата
interface SessionData {
  chatHistory: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
}

type MyContext = Context & SessionFlavor<SessionData>;

// Базовые настройки бота
const BOT_NAME = "ARK-1";
const BOT_PLATFORM = "PLEXY";
const BOT_CREATOR = "@samgay_nis";
const ALLOWED_GROUP_ID = -1002567822254;

// Проверка режима запуска (Vercel/локальный)
const IS_VERCEL = process.env.VERCEL === "1";
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Получаем токены
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!TELEGRAM_BOT_TOKEN || !OPENROUTER_API_KEY) {
  console.error('Ошибка: TELEGRAM_BOT_TOKEN или OPENROUTER_API_KEY не указаны');
  process.exit(1);
}

// Клавиатура для бота
function getMainKeyboard(): Keyboard {
  return new Keyboard()
    .text("❓ Задать вопрос")
    .text("📸 Анализ изображения")
    .row()
    .text("ℹ️ О боте")
    .text("🧹 Очистить историю")
    .resized();
}

// Инициализация бота
const bot = new Bot<MyContext>(TELEGRAM_BOT_TOKEN);

// Простая сессия только для истории
bot.use(session({
  initial: (): SessionData => ({
    chatHistory: []
  }),
}));

// Проверка на разрешенный чат
function isAllowedGroup(ctx: MyContext): boolean {
  return ctx.chat?.type === "private" || ctx.chat?.id === ALLOWED_GROUP_ID;
}

// Обработка команды /start
bot.command("start", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  ctx.session.chatHistory = [];
  
  await ctx.reply(`👋 Привет! Я ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}.\nСоздан компанией ${BOT_CREATOR}.\nЯ могу ответить на ваши вопросы и обработать изображения.`, {
    reply_markup: getMainKeyboard(),
  });
});

// Очистка истории
bot.hears("🧹 Очистить историю", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  ctx.session.chatHistory = [];
  await ctx.reply("🧹 История очищена!", {
    reply_markup: getMainKeyboard(),
  });
});

// О боте
bot.hears("ℹ️ О боте", async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  await ctx.reply(`ℹ️ *О боте*\n\nЯ ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}.\nСоздан компанией ${BOT_CREATOR}.`, {
    parse_mode: "Markdown",
    reply_markup: getMainKeyboard(),
  });
});

// Обработка обычных текстовых сообщений
bot.on('message:text', async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  // Пропускаем команды и кнопки
  const text = ctx.message.text;
  if (text.startsWith('/') || 
      text === "❓ Задать вопрос" || 
      text === "📸 Анализ изображения" || 
      text === "ℹ️ О боте" || 
      text === "🧹 Очистить историю") {
    return;
  }
  
  try {
    // Показываем что печатаем
    ctx.api.sendChatAction(ctx.chat.id, "typing");
    
    // Сохраняем запрос в истории
    ctx.session.chatHistory.push({
      role: 'user',
      content: text
    });
    
    // Просто отправляем запрос и получаем ответ
    const response = await callOpenRouterAPI(ctx.session.chatHistory);
    
    // Сохраняем ответ в истории
    ctx.session.chatHistory.push({
      role: 'assistant',
      content: response
    });
    
    // Отвечаем пользователю
    await ctx.reply(response, {
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard(),
    });
    
  } catch (error) {
    console.error('Ошибка:', error);
    await ctx.reply('Извините, произошла ошибка. Попробуйте еще раз.', {
      reply_markup: getMainKeyboard(),
    });
  }
});

// Обработка фото
bot.on('message:photo', async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  try {
    // Показываем что печатаем
    ctx.api.sendChatAction(ctx.chat.id, "typing");
    
    // Получаем фото
    const photoInfo = ctx.message.photo;
    const fileId = photoInfo[photoInfo.length - 1].file_id;
    const fileInfo = await ctx.api.getFile(fileId);
    
    if (!fileInfo.file_path) {
      throw new Error("Не удалось получить путь к файлу");
    }
    
    // Формируем URL фото
    const photoUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;
    
    // Получаем подпись или стандартный текст
    const caption = ctx.message.caption || "Опиши, что на этом изображении";
    
    // Строим запрос с изображением
    const response = await callOpenRouterAPIWithImage(caption, photoUrl);
    
    // Создаем клавиатуру для изображения
    const inlineKeyboard = new InlineKeyboard()
      .text("Подробнее", "more_details")
      .text("Перевести", "translate");
    
    // Отвечаем пользователю
    await ctx.reply(response, {
      parse_mode: 'Markdown',
      reply_markup: inlineKeyboard,
    });
    
  } catch (error) {
    console.error('Ошибка при обработке изображения:', error);
    await ctx.reply('Извините, произошла ошибка с изображением. Попробуйте еще раз.', {
      reply_markup: getMainKeyboard(),
    });
  }
});

// Кнопки для изображения
bot.callbackQuery(["more_details", "translate"], async (ctx: MyContext) => {
  if (!isAllowedGroup(ctx)) return;
  
  try {
    // Сразу подтверждаем получение колбека
    await ctx.answerCallbackQuery();
    
    // Показываем что печатаем
    if (ctx.chat) {
      ctx.api.sendChatAction(ctx.chat.id, "typing");
    }
    
    let prompt = "";
    if (ctx.callbackQuery.data === "more_details") {
      prompt = "Предоставь более подробный анализ изображения выше";
    } else {
      prompt = "Переведи весь текст с изображения выше на русский язык";
    }
    
    // Добавляем запрос в историю
    ctx.session.chatHistory.push({
      role: 'user',
      content: prompt
    });
    
    // Отправляем запрос и получаем ответ
    const response = await callOpenRouterAPI(ctx.session.chatHistory);
    
    // Сохраняем ответ в истории
    ctx.session.chatHistory.push({
      role: 'assistant',
      content: response
    });
    
    // Отвечаем пользователю
    await ctx.reply(response, {
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard(),
    });
    
  } catch (error) {
    console.error('Ошибка при обработке колбека:', error);
    await ctx.reply('Извините, произошла ошибка. Попробуйте еще раз.', {
      reply_markup: getMainKeyboard(),
    });
  }
});

// Функция запроса к OpenRouter API
async function callOpenRouterAPI(chatHistory: SessionData['chatHistory']): Promise<string> {
  try {
    // Готовим запрос с историей
    const messages = [
      {
        role: 'system',
        content: `Ты ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}. Отвечай на русском языке кратко и по делу.`
      },
      ...chatHistory.slice(-5)
    ];
    
    // Отправляем запрос
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-4-maverick:free',
        messages: messages,
        max_tokens: 800
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000
      }
    );
    
    // Возвращаем текст ответа
    return response.data.choices[0].message.content || 'Нет ответа';
    
  } catch (error) {
    console.error('Ошибка API:', error);
    return 'Произошла ошибка при обращении к API';
  }
}

// Функция запроса с изображением
async function callOpenRouterAPIWithImage(query: string, imageUrl: string): Promise<string> {
  try {
    // Формируем сообщение с изображением
    const messages = [
      {
        role: 'system',
        content: `Ты ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}. Отвечай на русском языке кратко и по делу.`
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: query },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ];
    
    // Отправляем запрос
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-4-maverick:free',
        messages: messages,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 45000
      }
    );
    
    // Возвращаем текст ответа
    return response.data.choices[0].message.content || 'Нет ответа';
    
  } catch (error) {
    console.error('Ошибка API при обработке изображения:', error);
    return 'Произошла ошибка при обработке изображения';
  }
}

// Функция для обработки вебхуков
async function handleWebhook(req: any, res: any) {
  // Сразу отвечаем OK
  res.status(200).send('OK');
  
  try {
    // Просто обрабатываем обновление
    if (req.body) {
      await bot.handleUpdate(req.body);
    }
  } catch (error) {
    console.error('Ошибка вебхука:', error);
  }
}

// Запуск бота
if (IS_VERCEL) {
  console.log(`Бот запущен в режиме вебхуков на ${WEBHOOK_URL}`);
  module.exports = async (req: any, res: any) => {
    await handleWebhook(req, res);
  };
} else {
  bot.start();
  console.log('Бот запущен в режиме long polling!');
} 