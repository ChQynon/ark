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

// Просто логирование для отладки
bot.use(async (ctx, next) => {
  console.log('Получен запрос:', ctx.update.update_id, JSON.stringify(ctx.message?.text).substring(0, 30));
  await next();
  console.log('Запрос обработан:', ctx.update.update_id);
});

// Обработка команды /start
bot.command("start", async (ctx) => {
  await ctx.reply(`👋 Привет! Я ARK-1, ИИ-ассистент. Отправь мне сообщение или фото.`);
  console.log('Команда start обработана');
});

// Обработка ВСЕХ текстовых сообщений
bot.on('message:text', async (ctx) => {
  const text = ctx.message.text || '';
  
  // Пропускаем ТОЛЬКО команды, на ВСЁ остальное отвечаем
  if (text.startsWith('/')) {
    console.log('Пропуск команды:', text);
    return;
  }
  
  console.log('Обработка текста:', text.substring(0, 30));
  
  try {
    // Мгновенно начинаем печатать
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
        timeout: 10000 // Еще меньше таймаут - 10 секунд
      }
    );
    
    // Мгновенно отвечаем пользователю
    const responseText = response.data.choices[0].message.content || 'Нет ответа';
    await ctx.reply(responseText);
    console.log('Отправлен ответ:', responseText.substring(0, 30));
    
  } catch (error) {
    console.error('Ошибка при обработке текста:', error.message);
    await ctx.reply('Ошибка при обработке запроса. Пожалуйста, попробуйте еще раз.');
  }
});

// Обработка фото
bot.on('message:photo', async (ctx) => {
  console.log('Обработка фото');
  try {
    // Показываем что печатаем
    await ctx.api.sendChatAction(ctx.chat.id, "typing");
    
    // Получаем фото
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
    
    // Быстрый запрос с изображением
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
        timeout: 15000 // Еще быстрее - 15 секунд
      }
    );
    
    // Отвечаем пользователю
    const responseText = response.data.choices[0].message.content || 'Нет ответа';
    await ctx.reply(responseText);
    console.log('Отправлен ответ на фото');
    
  } catch (error) {
    console.error('Ошибка при обработке изображения:', error.message);
    await ctx.reply('Ошибка при обработке изображения. Попробуйте другое фото.');
  }
});

// Обработка всех остальных сообщений
bot.on('message', async (ctx) => {
  console.log('Получено сообщение другого типа');
  await ctx.reply('Отправьте мне текст или изображение.');
});

// Хендлер любых ошибок бота
bot.catch((err) => {
  console.error('Ошибка бота:', err);
});

// Обработка вебхуков от Telegram
module.exports = async (req, res) => {
  // Сразу отвечаем OK для избежания таймаутов
  res.status(200).send('OK');
  
  // Обрабатываем запрос асинхронно
  try {
    if (req.body) {
      console.log('Получен вебхук:', req.body.update_id);
      await bot.handleUpdate(req.body);
    } else {
      console.error('Пустой запрос без тела');
    }
  } catch (error) {
    console.error('Ошибка вебхука:', error.message);
  }
};

// Для локальной разработки
if (process.env.NODE_ENV !== 'production') {
  bot.start();
  console.log('Бот запущен в режиме разработки!');
} 