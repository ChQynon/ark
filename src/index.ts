import { Bot } from 'grammy';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Получаем токены
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!TELEGRAM_BOT_TOKEN || !OPENROUTER_API_KEY) {
  console.error('Ошибка: TELEGRAM_BOT_TOKEN или OPENROUTER_API_KEY не указаны');
  process.exit(1);
}

// Инициализация бота
const bot = new Bot(TELEGRAM_BOT_TOKEN);

// Обработка команды /start
bot.command("start", async (ctx) => {
  await ctx.reply(`👋 Привет! Я ARK-1, ИИ-ассистент. Отправь мне сообщение или фото.`);
});

// Обработка обычных текстовых сообщений
bot.on('message:text', async (ctx) => {
  // Пропускаем команды
  const text = ctx.message.text;
  if (text.startsWith('/')) return;
  
  try {
    // Показываем что печатаем
    await ctx.api.sendChatAction(ctx.chat.id, "typing");
    
    // Быстрый запрос к API
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-4-maverick:free',
        messages: [
          {
            role: 'system',
            content: 'Ты ARK-1, ИИ-ассистент. Отвечай коротко и только по делу, без лишних слов. Пиши только на русском языке.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000 // Уменьшаем таймаут до 15 секунд
      }
    );
    
    // Мгновенно отвечаем пользователю
    const responseText = response.data.choices[0].message.content || 'Нет ответа';
    await ctx.reply(responseText);
    
  } catch (error) {
    console.error('Ошибка:', error);
    await ctx.reply('Ошибка при обработке запроса. Попробуйте еще раз позже.');
  }
});

// Обработка фото
bot.on('message:photo', async (ctx) => {
  try {
    // Показываем что печатаем
    await ctx.api.sendChatAction(ctx.chat.id, "typing");
    
    // Получаем фото максимально быстро
    const photoInfo = ctx.message.photo;
    const fileId = photoInfo[photoInfo.length - 1].file_id;
    const fileInfo = await ctx.api.getFile(fileId);
    
    if (!fileInfo.file_path) {
      throw new Error("Не удалось получить файл");
    }
    
    // Формируем URL фото
    const photoUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;
    
    // Получаем подпись или стандартный текст
    const caption = ctx.message.caption || "Опиши, что на этом изображении";
    
    // Отправляем простой запрос с изображением
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-4-maverick:free',
        messages: [
          {
            role: 'system',
            content: 'Ты ARK-1, ИИ-ассистент. Отвечай кратко по делу и только на русском языке.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: caption },
              { type: 'image_url', image_url: { url: photoUrl } }
            ]
          }
        ],
        max_tokens: 800
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000 // Уменьшаем таймаут до 20 секунд
      }
    );
    
    // Отвечаем пользователю
    const responseText = response.data.choices[0].message.content || 'Нет ответа';
    await ctx.reply(responseText);
    
  } catch (error) {
    console.error('Ошибка при обработке изображения:', error);
    await ctx.reply('Ошибка при обработке изображения. Попробуйте другое фото или позже.');
  }
});

// Обработка вебхуков от Telegram
module.exports = async (req: any, res: any) => {
  // Сразу отвечаем OK для избежания таймаутов
  res.status(200).send('OK');
  
  // Обрабатываем запрос асинхронно
  try {
    if (req.body) {
      await bot.handleUpdate(req.body);
    }
  } catch (error) {
    console.error('Ошибка вебхука:', error);
  }
};

// Для локальной разработки
if (process.env.NODE_ENV !== 'production') {
  bot.start();
  console.log('Бот запущен в режиме разработки!');
} 