import { Bot, Context, session, SessionFlavor, Keyboard } from 'grammy';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Базовые настройки бота
const BOT_NAME = "ARK-1";
const BOT_PLATFORM = "PLEXY";
const BOT_CREATOR = "@samgay_nis";

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
const bot = new Bot(TELEGRAM_BOT_TOKEN);

// Обработка команды /start
bot.command("start", async (ctx) => {
  await ctx.reply(`👋 Привет! Я ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}.\nСоздан компанией ${BOT_CREATOR}.\nЯ могу ответить на ваши вопросы и обработать изображения.`, {
    reply_markup: getMainKeyboard(),
  });
});

// О боте
bot.hears("ℹ️ О боте", async (ctx) => {
  await ctx.reply(`ℹ️ *О боте*\n\nЯ ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}.\nСоздан компанией ${BOT_CREATOR}.`, {
    parse_mode: "Markdown",
    reply_markup: getMainKeyboard(),
  });
});

// Обработка обычных текстовых сообщений
bot.on('message:text', async (ctx) => {
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
    await ctx.api.sendChatAction(ctx.chat.id, "typing");
    
    // Формируем запрос к API
    const messages = [
      {
        role: 'system',
        content: `Ты ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}. Отвечай на русском языке кратко и по делу.`
      },
      {
        role: 'user',
        content: text
      }
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
        timeout: 20000
      }
    );
    
    // Отвечаем пользователю
    const responseText = response.data.choices[0].message.content || 'Нет ответа';
    await ctx.reply(responseText, {
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
bot.on('message:photo', async (ctx) => {
  try {
    // Показываем что печатаем
    await ctx.api.sendChatAction(ctx.chat.id, "typing");
    
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
    
    // Формируем сообщение с изображением
    const messages = [
      {
        role: 'system',
        content: `Ты ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}. Отвечай на русском языке кратко и по делу.`
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: caption },
          { type: 'image_url', image_url: { url: photoUrl } }
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
        timeout: 25000
      }
    );
    
    // Отвечаем пользователю
    const responseText = response.data.choices[0].message.content || 'Нет ответа';
    await ctx.reply(responseText, {
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard(),
    });
    
  } catch (error) {
    console.error('Ошибка при обработке изображения:', error);
    await ctx.reply('Извините, произошла ошибка с изображением. Попробуйте еще раз.', {
      reply_markup: getMainKeyboard(),
    });
  }
});

// Запуск бота
bot.start();
console.log('Бот запущен в режиме long polling!'); 