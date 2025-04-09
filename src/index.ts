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

// ВАЖНО: Сначала регистрируем команды, потом общие обработчики
bot.command("start", async (ctx) => {
  console.log('🟢 СТАРТ КОМАНДА - Обработка...');
  await ctx.reply(`👋 Привет! Я ARK-1, ИИ-ассистент. Отправь мне сообщение или фото.`);
  console.log('✅ СТАРТ КОМАНДА - Отправлен ответ');
});

// Функция для отправки текстовой подсказки пользователю
async function respondToText(ctx, text) {
  console.log('🟢 ТЕКСТ - Обработка:', text.substring(0, 30));
  
  try {
    // Сразу показываем набор текста
    await ctx.api.sendChatAction(ctx.chat.id, "typing").catch(e => 
      console.error("Ошибка отправки 'печатает':", e.message)
    );
    
    // Прямой запрос к API
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-4-maverick:free',
        messages: [
          {
            role: 'system',
            content: 'Ты ARK-1, ИИ-ассистент. Отвечай коротко и только по делу, без лишних слов. Пиши только на русском языке.'
          },
          { role: 'user', content: text }
        ],
        max_tokens: 400,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 8000 // Ещё быстрее - 8 секунд
      }
    );
    
    // Формируем и отправляем ответ
    const responseText = response.data?.choices[0]?.message?.content || 'Нет ответа';
    await ctx.reply(responseText);
    console.log('✅ ТЕКСТ - Отправлен ответ:', responseText.substring(0, 30));
    return true;
    
  } catch (error) {
    console.error('❌ ТЕКСТ - Ошибка обработки:', error.message);
    await ctx.reply('Ошибка обработки. Попробуйте написать что-то другое.').catch(e => 
      console.error("Ошибка отправки ошибки:", e.message)
    );
    return false;
  }
}

// ОБРАБОТКА ВСЕХ ТИПОВ СООБЩЕНИЙ
bot.on('message', async (ctx) => {
  // 1. Сначала проверяем, команда ли это
  if (ctx.message.text && ctx.message.text.startsWith('/')) {
    console.log('⏩ Пропуск команды:', ctx.message.text);
    return;
  }
  
  // 2. Проверяем текстовое сообщение
  if (ctx.message.text) {
    await respondToText(ctx, ctx.message.text);
    return;
  }
  
  // 3. Если это фото
  if (ctx.message.photo) {
    console.log('🟢 ФОТО - Обработка...');
    try {
      await ctx.api.sendChatAction(ctx.chat.id, "typing");
      
      const photoInfo = ctx.message.photo;
      const fileId = photoInfo[photoInfo.length - 1].file_id;
      const fileInfo = await ctx.api.getFile(fileId);
      
      if (!fileInfo.file_path) {
        throw new Error("Не удалось получить файл");
      }
      
      // Формируем URL фото
      const photoUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;
      const caption = ctx.message.caption || "Опиши что на этом изображении";
      
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
          max_tokens: 600
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 12000
        }
      );
      
      const responseText = response.data?.choices[0]?.message?.content || 'Нет ответа';
      await ctx.reply(responseText);
      console.log('✅ ФОТО - Отправлен ответ');
      
    } catch (error) {
      console.error('❌ ФОТО - Ошибка:', error.message);
      await ctx.reply('Ошибка при обработке фото. Попробуйте другое изображение.');
    }
    return;
  }
  
  // 4. Любой другой тип сообщения
  console.log('🟢 ДРУГОЕ - Получено сообщение другого типа');
  await ctx.reply('Отправьте мне текст или изображение для анализа.').catch(e => 
    console.error("Ошибка отправки:", e.message)
  );
});

// ОБРАБОТКА ЗАПРОСОВ ОТ TELEGRAM
module.exports = async (req, res) => {
  // Сразу отвечаем OK
  if (!res.headersSent) {
    res.status(200).send('OK');
  }
  
  try {
    // Проверяем наличие тела запроса
    if (!req.body) {
      console.error('⚠️ ВЕБХУК - Пустой запрос без тела');
      return;
    }
    
    console.log(`🔵 ВЕБХУК - ID: ${req.body.update_id}, Тип: ${req.body.message ? (req.body.message.text ? 'Текст' : 'Другое') : 'Неизвестно'}`);
    
    // Передаем запрос боту
    await bot.handleUpdate(req.body);
    console.log(`✅ ВЕБХУК - Обработан запрос: ${req.body.update_id}`);
    
  } catch (error) {
    console.error(`❌ ВЕБХУК - Ошибка: ${error.message}`);
  }
};

// Для локальной разработки
if (process.env.NODE_ENV !== 'production') {
  bot.start();
  console.log('Бот запущен в режиме разработки!');
} 